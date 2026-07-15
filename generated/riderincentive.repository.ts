
import { Injectable } from "@nestjs/common";
import { client } from "../src/client";
import { RiderIncentive, User } from "./types";
import { types } from "cassandra-driver";

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as stream from "stream";
import { promisify } from "util";

const pipeline = promisify(stream.pipeline);

@Injectable()
export class RiderIncentiveRepository {

  private allowedFields:string[]=["rider_id","date","daily_earnings","trips_completed","incentive_bonus"];

  private cache = new Map<string,{data:any,expiry:number}>();
  private CACHE_TTL = 1000 * 60 * 5;

  private uploadDir = path.join(process.cwd(),"uploads");

  constructor(){
    if(!fs.existsSync(this.uploadDir)){
      fs.mkdirSync(this.uploadDir,{recursive:true});
    }
  }

  private safeArray<T>(data:any): T[] {
    return Array.isArray(data) ? data : [];
  }

  private async execute(query:string, params:any[]=[]): Promise<{rows:any[]}>{
    const res = await client.execute(query,params,{prepare:true});
    return { rows: this.safeArray(res?.rows) };
  }

  private toPK(value:any){
    try{
      if(typeof value==="string" && value.includes("-")){
        return types.Uuid.fromString(value);
      }
    }catch(e){}
    return value;
  }

  private cleanData(data:Partial<RiderIncentive>){
    return Object.fromEntries(
      Object.entries(data).filter(
        ([k,v]) =>
          v!==undefined &&
          this.allowedFields.includes(k) &&
          k!=="rider_id" &&
          k!=="date"
      )
    );
  }

  /* ================= EXISTS ================= */

  private async exists(rider_id:string, date:string){

    const query = "SELECT rider_id FROM riderincentive WHERE rider_id=? AND date=?";

    const params = [
      this.toPK(rider_id)
      , date
    ];

    const res = await this.execute(query, params);
    return res.rows.length > 0;
  }

  /* ================= CONDITIONS ================= */

  private buildConditions(condition:any){
    if(!condition) return [];

    const clauses:string[]=[];
    const values:any[]=[];

    for(const [k,v] of Object.entries(condition)){
      if(!this.allowedFields.includes(k)) continue;
      clauses.push(`${k}=?`);
      values.push(k==="rider_id" ? this.toPK(v) : v);
    }

    if(!clauses.length) return [];
    return [{clause:clauses.join(" AND "),values}];
  }

  /* ================= CACHE ================= */

  private setCache(key:string,data:any){
    this.cache.set(key,{
      data,
      expiry: Date.now() + this.CACHE_TTL
    });
  }

  private getCache(key:string){
    const item = this.cache.get(key);
    if(!item) return null;

    if(item.expiry < Date.now()){
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /* ================= FILE ================= */

  private safeFileName(original:string){
    const ext = path.extname(original);
    const hash = crypto.randomBytes(16).toString("hex");
    return `${Date.now()}-${hash}${ext}`;
  }

  async upload_file(file:any){

    if(!file || (!file.buffer && !file.stream)){
      throw new Error("Invalid file");
    }

    const fileName = this.safeFileName(file.originalname || "file");
    const filePath = path.join(this.uploadDir,fileName);

    await pipeline(
      file.buffer
        ? stream.Readable.from(file.buffer)
        : file.stream,
      fs.createWriteStream(filePath)
    );

    return {
      message:"upload success",
      url:`/uploads/${fileName}`
    };
  }

  async upload_files(files:any[]){

    if(!Array.isArray(files) || !files.length){
      throw new Error("No files provided");
    }

    const results:any[] = [];

    for(const file of files){

      if(!file || (!file.buffer && !file.stream)) continue;

      const fileName = this.safeFileName(file.originalname || "file");
      const filePath = path.join(this.uploadDir,fileName);

      await pipeline(
        file.buffer
          ? stream.Readable.from(file.buffer)
          : file.stream,
        fs.createWriteStream(filePath)
      );

      results.push({
        fileName,
        url:`/uploads/${fileName}`
      });
    }

    return {
      message:"multiple upload success",
      count: results.length,
      files: results
    };
  }

  async upload_stream(file:any){

    if(!file || !file.stream){
      throw new Error("Invalid stream file");
    }

    const fileName = this.safeFileName(file.originalname || "file");
    const filePath = path.join(this.uploadDir,fileName);

    await pipeline(
      file.stream,
      fs.createWriteStream(filePath)
    );

    return {
      message:"stream upload success",
      url:`/uploads/${fileName}`
    };
  }

  /* ================= FIND ================= */

  async find_one(rider_id:string, date:string){

    const query = "SELECT * FROM riderincentive WHERE rider_id=? AND date=?";

    const params = [
      this.toPK(rider_id)
      , date
    ];

    const res = await this.execute(query, params);

    if(!res.rows.length)
      return {message:"Record not found",data:[]};

    return {message:"find_one success",data:res.rows};
  }

  async find_cached(rider_id:string, date:string){

    const key = "${rider_id}-${date}";

    const cached = this.getCache(key);
    if(cached) return {message:"cache hit",data:cached};

    const result = await this.find_one(rider_id, date);

    if(result.data.length){
      this.setCache(key,result.data);
    }

    return result;
  }

  async find_all(){
    const res = await this.execute("SELECT * FROM riderincentive");
    return {message:"find_all success",data:res.rows};
  }

  async find_with_pagination(limit=10,pageState?:string){

    const res = await client.execute(
      "SELECT * FROM riderincentive",
      [],
      {prepare:true,fetchSize:limit,pageState}
    );

    return {
      message:"pagination success",
      data:this.safeArray(res?.rows),
      nextPage:res.pageState
    };
  }

  async find_by(condition:any){

    const queries=this.buildConditions(condition);
    if(!queries.length)
      return {message:"No valid condition",data:[]};

    const results=new Map<string,any>();

    for(const q of queries){

      const res = await this.execute(
        `SELECT * FROM riderincentive WHERE ${q.clause} ALLOW FILTERING`,
        q.values
      );

      for(const r of res.rows){
        const key = "${r.rider_id}-${r.date}";
        results.set(key,r);
      }
    }

    return {
      message:"find_by success",
      data:Array.from(results.values())
    };
  }

  /* ================= INSERT ================= */

async insert_one(data: RiderIncentive){

  const payload: any = { ...data };

  // ✅ UUID
  if (!payload.rider_id) {
    payload.rider_id = types.Uuid.random();
  }

  // ✅ CLUSTER KEY
  if (!payload.date) {
    payload.date = new Date();
  }

  // ✅ DO NOT FILTER (important)
// ✅ ensure PK exists BEFORE keys extraction
if (!payload.id) {
  payload.id = types.Uuid.random();
}

if (!payload.created_at) {
  payload.created_at = new Date();
}

// ✅ now extract keys
const keys = Object.keys(payload);

  // ✅ ENSURE PRIMARY KEYS EXIST
  if (!keys.includes("rider_id")) {
    keys.unshift("rider_id");
  }

  
  if (!keys.includes("date")) {
    keys.push("date");
  }
  

  const query = `INSERT INTO riderincentive (${keys.join(",")})
                 VALUES (${keys.map(()=>"?").join(",")})`;

  const params = keys.map(k =>
    k === "rider_id"
      ? payload[k]
      : payload[k]
  );

  console.log("QUERY:", query);
  console.log("PARAMS:", params);

  await this.execute(query, params);

  return {
    message:"insert_one success",
    id: payload.rider_id.toString()
  };
}

async insert_many_batch(items: User[]) {

  if (!Array.isArray(items) || items.length === 0) {
    return { message: "No items provided", count: 0 };
  }

  const queries: any[] = [];

  for (const item of items) {

    const payload: any = { ...item };

    // ✅ Ensure PRIMARY KEYS
    payload.id = payload.id || types.Uuid.random();
    payload.created_at = payload.created_at || new Date();

    // ✅ Keys MUST be here
    const keys = Object.keys(payload);

    // ❗ Safety check
    if (!keys.includes("id")) {
      throw new Error("id missing");
    }

    const query = "INSERT INTO riderincentive (" + keys.join(",") + ") VALUES (" + keys.map(() => "?").join(",") + ")";

    const params = keys.map(k => payload[k]);

    queries.push({ query, params });
  }

  console.log("FINAL QUERIES:", queries);

  await client.batch(queries, { prepare: true });

  return {
    message: "insert_many_batch success",
    count: items.length
  };
}
  /* ================= UPDATE ================= */

  async update_one(rider_id:string, date:string,data:Partial<RiderIncentive>){

    if(!(await this.exists(rider_id, date))){
      return {message:"Record not found",updated:false};
    }

    const clean = this.cleanData(data);
    const keys = Object.keys(clean);

    if(!keys.length){
      return {message:"Nothing to update",updated:false};
    }

    const query = `UPDATE riderincentive
      SET ${keys.map(k=>`${k}=?`).join(",")}
      WHERE rider_id=? AND date=?`;

    await this.execute(
      query,
      [
        ...keys.map(k=>(clean as any)[k]),
        this.toPK(rider_id)
        , date
      ]
    );

    return {message:"update_one success",updated:true};
  }

  async update_all(rows:any[] = [], data:Partial<RiderIncentive>){
    if(!rows.length) return {message:"No rows provided",count:0};

    await Promise.all(
      rows.map(r => this.update_one(r.rider_id, r.date, data))
    );

    return {message:"update_all success",count:rows.length};
  }

  async update_by(condition:any, data:Partial<RiderIncentive>){
    const rows = await this.find_ids(condition);

    if(!rows.length){
      return {message:"No records found",updated:0};
    }

    await Promise.all(
      rows.map(r => this.update_one(r.rider_id, r.date, data))
    );

    return {message:"update_by success",updated:rows.length};
  }

  /* ================= FIND IDS ================= */

  private async find_ids(condition:any): Promise<any[]>{

    const queries = this.buildConditions(condition);
    if(!queries.length) return [];

    const rows:any[] = [];

    for(const q of queries){

      const res = await this.execute(
        `SELECT rider_id, date FROM riderincentive
         WHERE ${q.clause} ALLOW FILTERING`,
        q.values
      );

      for(const r of res.rows){
        rows.push({
          rider_id: r.rider_id.toString()
          , date: r.date
        });
      }
    }

    return rows;
  }

  /* ================= DELETE ================= */

  async delete_one(rider_id:string, date:string){

    if(!(await this.exists(rider_id, date))){
      return {message:"Record not found",deleted:false};
    }

    const query = "DELETE FROM riderincentive WHERE rider_id=? AND date=?";

    await this.execute(
      query,
      [this.toPK(rider_id) , date]
    );

    return {message:"delete_one success",deleted:true};
  }

  async delete_by(condition:any){

    const rows = await this.find_ids(condition);

    if(!rows.length){
      return {message:"No records found",deleted:0};
    }

    await Promise.all(
      rows.map(r => this.delete_one(r.rider_id, r.date))
    );

    return {message:"delete_by success",deleted:rows.length};
  }

  async delete_all(){
    await this.execute("TRUNCATE riderincentive");
    this.cache.clear();
    return {message:"delete_all success"};
  }

}
