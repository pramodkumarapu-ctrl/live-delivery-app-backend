
import { Injectable } from "@nestjs/common";
import { client } from "../src/client";
import { LiveTracking, User } from "./types";
import { types } from "cassandra-driver";

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as stream from "stream";
import { promisify } from "util";

const pipeline = promisify(stream.pipeline);

@Injectable()
export class LiveTrackingRepository {

  private allowedFields:string[]=["order_id","timestamp","lat","lng","bearing","battery_level","ttl"];

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

  private cleanData(data:Partial<LiveTracking>){
    return Object.fromEntries(
      Object.entries(data).filter(
        ([k,v]) =>
          v!==undefined &&
          this.allowedFields.includes(k) &&
          k!=="order_id" &&
          k!=="timestamp"
      )
    );
  }

  /* ================= EXISTS ================= */

  private async exists(order_id:string, timestamp:string){

    const query = "SELECT order_id FROM livetracking WHERE order_id=? AND timestamp=?";

    const params = [
      this.toPK(order_id)
      , timestamp
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
      values.push(k==="order_id" ? this.toPK(v) : v);
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

  async find_one(order_id:string, timestamp:string){

    const query = "SELECT * FROM livetracking WHERE order_id=? AND timestamp=?";

    const params = [
      this.toPK(order_id)
      , timestamp
    ];

    const res = await this.execute(query, params);

    if(!res.rows.length)
      return {message:"Record not found",data:[]};

    return {message:"find_one success",data:res.rows};
  }

  async find_cached(order_id:string, timestamp:string){

    const key = "${order_id}-${timestamp}";

    const cached = this.getCache(key);
    if(cached) return {message:"cache hit",data:cached};

    const result = await this.find_one(order_id, timestamp);

    if(result.data.length){
      this.setCache(key,result.data);
    }

    return result;
  }

  async find_all(){
    const res = await this.execute("SELECT * FROM livetracking");
    return {message:"find_all success",data:res.rows};
  }

  async find_with_pagination(limit=10,pageState?:string){

    const res = await client.execute(
      "SELECT * FROM livetracking",
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
        `SELECT * FROM livetracking WHERE ${q.clause} ALLOW FILTERING`,
        q.values
      );

      for(const r of res.rows){
        const key = "${r.order_id}-${r.timestamp}";
        results.set(key,r);
      }
    }

    return {
      message:"find_by success",
      data:Array.from(results.values())
    };
  }

  /* ================= INSERT ================= */

async insert_one(data: LiveTracking){

  const payload: any = { ...data };

  // ✅ UUID
  if (!payload.order_id) {
    payload.order_id = types.Uuid.random();
  }

  // ✅ CLUSTER KEY
  if (!payload.timestamp) {
    payload.timestamp = new Date();
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
  if (!keys.includes("order_id")) {
    keys.unshift("order_id");
  }

  
  if (!keys.includes("timestamp")) {
    keys.push("timestamp");
  }
  

  const query = `INSERT INTO livetracking (${keys.join(",")})
                 VALUES (${keys.map(()=>"?").join(",")})`;

  const params = keys.map(k =>
    k === "order_id"
      ? payload[k]
      : payload[k]
  );

  console.log("QUERY:", query);
  console.log("PARAMS:", params);

  await this.execute(query, params);

  return {
    message:"insert_one success",
    id: payload.order_id.toString()
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

    const query = "INSERT INTO livetracking (" + keys.join(",") + ") VALUES (" + keys.map(() => "?").join(",") + ")";

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

  async update_one(order_id:string, timestamp:string,data:Partial<LiveTracking>){

    if(!(await this.exists(order_id, timestamp))){
      return {message:"Record not found",updated:false};
    }

    const clean = this.cleanData(data);
    const keys = Object.keys(clean);

    if(!keys.length){
      return {message:"Nothing to update",updated:false};
    }

    const query = `UPDATE livetracking
      SET ${keys.map(k=>`${k}=?`).join(",")}
      WHERE order_id=? AND timestamp=?`;

    await this.execute(
      query,
      [
        ...keys.map(k=>(clean as any)[k]),
        this.toPK(order_id)
        , timestamp
      ]
    );

    return {message:"update_one success",updated:true};
  }

  async update_all(rows:any[] = [], data:Partial<LiveTracking>){
    if(!rows.length) return {message:"No rows provided",count:0};

    await Promise.all(
      rows.map(r => this.update_one(r.order_id, r.timestamp, data))
    );

    return {message:"update_all success",count:rows.length};
  }

  async update_by(condition:any, data:Partial<LiveTracking>){
    const rows = await this.find_ids(condition);

    if(!rows.length){
      return {message:"No records found",updated:0};
    }

    await Promise.all(
      rows.map(r => this.update_one(r.order_id, r.timestamp, data))
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
        `SELECT order_id, timestamp FROM livetracking
         WHERE ${q.clause} ALLOW FILTERING`,
        q.values
      );

      for(const r of res.rows){
        rows.push({
          order_id: r.order_id.toString()
          , timestamp: r.timestamp
        });
      }
    }

    return rows;
  }

  /* ================= DELETE ================= */

  async delete_one(order_id:string, timestamp:string){

    if(!(await this.exists(order_id, timestamp))){
      return {message:"Record not found",deleted:false};
    }

    const query = "DELETE FROM livetracking WHERE order_id=? AND timestamp=?";

    await this.execute(
      query,
      [this.toPK(order_id) , timestamp]
    );

    return {message:"delete_one success",deleted:true};
  }

  async delete_by(condition:any){

    const rows = await this.find_ids(condition);

    if(!rows.length){
      return {message:"No records found",deleted:0};
    }

    await Promise.all(
      rows.map(r => this.delete_one(r.order_id, r.timestamp))
    );

    return {message:"delete_by success",deleted:rows.length};
  }

  async delete_all(){
    await this.execute("TRUNCATE livetracking");
    this.cache.clear();
    return {message:"delete_all success"};
  }

}
