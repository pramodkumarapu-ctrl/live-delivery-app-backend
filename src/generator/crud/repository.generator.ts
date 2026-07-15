// import { ModelNode } from "../../core_db/scylla.parser";

// export function buildRepository(model: ModelNode): string {

//   const table = model.name.toLowerCase();
//   const pk = model.partitionKey[0];
//   const ck = model.clusteringKey?.[0];
//   const fields = model.fields.map(f => `"${f.name}"`).join(",");

//   return `
// import { Injectable } from "@nestjs/common";
// import { client } from "../src/client";
// import { ${model.name} } from "./types";
// import { types } from "cassandra-driver";

// import * as fs from "fs";
// import * as path from "path";
// import * as crypto from "crypto";
// import * as stream from "stream";
// import { promisify } from "util";

// const pipeline = promisify(stream.pipeline);

// @Injectable()
// export class ${model.name}Repository {

//   private allowedFields:string[]=[${fields}];

//   private cache = new Map<string,{data:any,expiry:number}>();
//   private CACHE_TTL = 1000 * 60 * 5;

//   private uploadDir = path.join(process.cwd(),"uploads");

//   constructor(){
//     if(!fs.existsSync(this.uploadDir)){
//       fs.mkdirSync(this.uploadDir,{recursive:true});
//     }
//   }

//   private safeArray<T>(data:any): T[] {
//     return Array.isArray(data) ? data : [];
//   }

//   private async execute(query:string, params:any[]=[]): Promise<{rows:any[]}>{
//     const res = await client.execute(query,params,{prepare:true});
//     return { rows: this.safeArray(res?.rows) };
//   }

//   private toPK(value:any){
//     try{
//       if(typeof value==="string" && value.includes("-")){
//         return types.Uuid.fromString(value);
//       }
//     }catch(e){}
//     return value;
//   }

//   private cleanData(data:Partial<${model.name}>){
//     return Object.fromEntries(
//       Object.entries(data).filter(
//         ([k,v]) =>
//           v!==undefined &&
//           this.allowedFields.includes(k) &&
//           k!=="${pk}" &&
//           ${ck ? `k!=="${ck}"` : "true"}
//       )
//     );
//   }

//   private async exists(${pk}:string,${ck ?? "ck"}:string){
//     const res = await this.execute(
//       "SELECT ${pk} FROM ${table} WHERE ${pk}=? ${ck ? `AND ${ck}=?` : ""}",
//       [this.toPK(${pk})${ck ? `,${ck}` : ""}]
//     );
//     return res.rows.length > 0;
//   }

//   private buildConditions(condition:any){
//     if(!condition) return [];

//     const clauses:string[]=[];
//     const values:any[]=[];

//     for(const [k,v] of Object.entries(condition)){
//       if(!this.allowedFields.includes(k)) continue;
//       clauses.push(\`\${k}=?\`);
//       values.push(k==="${pk}" ? this.toPK(v) : v);
//     }

//     if(!clauses.length) return [];
//     return [{clause:clauses.join(" AND "),values}];
//   }

//   private setCache(key:string,data:any){
//     this.cache.set(key,{
//       data,
//       expiry: Date.now() + this.CACHE_TTL
//     });
//   }

//   private getCache(key:string){
//     const item = this.cache.get(key);
//     if(!item) return null;

//     if(item.expiry < Date.now()){
//       this.cache.delete(key);
//       return null;
//     }

//     return item.data;
//   }

//   private safeFileName(original:string){
//     const ext = path.extname(original);
//     const hash = crypto.randomBytes(16).toString("hex");
//     return \`\${Date.now()}-\${hash}\${ext}\`;
//   }

//   /* ================= UPLOAD ================= */

//   async upload_file(file:any){

//     if(!file || (!file.buffer && !file.stream)){
//       throw new Error("Invalid file");
//     }

//     const fileName = this.safeFileName(file.originalname || "file");
//     const filePath = path.join(this.uploadDir,fileName);

//     if(file.buffer){
//       await pipeline(
//         stream.Readable.from(file.buffer),
//         fs.createWriteStream(filePath)
//       );
//     } else {
//       await pipeline(
//         file.stream,
//         fs.createWriteStream(filePath)
//       );
//     }

//     return {
//       message:"upload success",
//       url:\`/uploads/\${fileName}\`
//     };
//   }

//   async upload_files(files:any[]){

//     if(!Array.isArray(files) || !files.length){
//       throw new Error("No files provided");
//     }

//     const results:any[] = [];

//     for(const file of files){

//       if(!file || (!file.buffer && !file.stream)) continue;

//       const fileName = this.safeFileName(file.originalname || "file");
//       const filePath = path.join(this.uploadDir,fileName);

//       if(file.buffer){
//         await pipeline(
//           stream.Readable.from(file.buffer),
//           fs.createWriteStream(filePath)
//         );
//       } else {
//         await pipeline(
//           file.stream,
//           fs.createWriteStream(filePath)
//         );
//       }

//       results.push({
//         fileName,
//         url:\`/uploads/\${fileName}\`
//       });
//     }

//     return {
//       message:"multiple upload success",
//       count: results.length,
//       files: results
//     };
//   }

//   async upload_stream(file:any){

//     if(!file || !file.stream){
//       throw new Error("Invalid stream file");
//     }

//     const fileName = this.safeFileName(file.originalname || "file");
//     const filePath = path.join(this.uploadDir,fileName);

// await pipeline(
//   file.stream,
//   fs.createWriteStream(filePath) // ✅ correct
// );

//     return {
//       message:"stream upload success",
//       url:\`/uploads/\${fileName}\`
//     };
//   }

//   /* ================= FIND ================= */

//   async find_one(${pk}:string,${ck}:string){
//     const res = await this.execute(
//       "SELECT * FROM ${table} WHERE ${pk}=? AND ${ck}=?",
//       [this.toPK(${pk}),${ck}]
//     );

//     if(!res.rows.length)
//       return {message:"Record not found",data:[]};

//     return {message:"find_one success",data:res.rows};
//   }

//   async find_cached(${pk}:string,${ck}:string){

//     const key=\`\${${pk}}-\${${ck}}\`;

//     const cached = this.getCache(key);
//     if(cached) return {message:"cache hit",data:cached};

//     const result = await this.find_one(${pk},${ck});

//     if(result.data.length){
//       this.setCache(key,result.data);
//     }

//     return result;
//   }

//   async find_all(){
//     const res = await this.execute("SELECT * FROM ${table}");
//     return {message:"find_all success",data:res.rows};
//   }

//   async find_with_pagination(limit=10,pageState?:string){

//     const res = await client.execute(
//       "SELECT * FROM ${table}",
//       [],
//       {prepare:true,fetchSize:limit,pageState}
//     );

//     return {
//       message:"pagination success",
//       data:this.safeArray(res?.rows),
//       nextPage:res.pageState
//     };
//   }

//   async find_by(condition:any){

//     const queries=this.buildConditions(condition);
//     if(!queries.length)
//       return {message:"No valid condition",data:[]};

//     const results=new Map<string,any>();

//     for(const q of queries){

//       const res = await this.execute(
//         \`SELECT * FROM ${table} WHERE \${q.clause} ALLOW FILTERING\`,
//         q.values
//       );

//       for(const r of res.rows){
//         const key=\`\${r.${pk}}-\${r.${ck}}\`;
//         results.set(key,r);
//       }
//     }

//     return {
//       message:"find_by success",
//       data:Array.from(results.values())
//     };
//   }

//   /* ================= INSERT ================= */

//   async insert_one(data:${model.name}){

//     const keys = Object.keys(data).filter(k=>this.allowedFields.includes(k));
//     if(!keys.length) return {message:"No valid fields"};

//     await this.execute(
//       \`INSERT INTO ${table} (\${keys.join(",")})
//        VALUES (\${keys.map(()=>"?").join(",")})\`,
//       keys.map(k=>k==="${pk}" ? this.toPK((data as any)[k]) : (data as any)[k])
//     );

//     return {message:"insert_one success"};
//   }

//   async insert_many_batch(items:${model.name}[]){

//     if(!Array.isArray(items) || !items.length){
//       return {message:"No items provided",count:0};
//     }

//     const queries = items.map(item=>{
//       const keys = Object.keys(item).filter(k=>this.allowedFields.includes(k));

//       return {
//         query:\`INSERT INTO ${table} (\${keys.join(",")})
//                VALUES (\${keys.map(()=>"?").join(",")})\`,
//         params: keys.map(k=>k==="${pk}" ? this.toPK((item as any)[k]) : (item as any)[k])
//       };
//     });

//     await client.batch(queries,{prepare:true});

//     return {message:"insert_many_batch success",count:items.length};
//   }

//   /* ================= UPDATE ================= */

//   async update_one(${pk}:string,${ck}:string,data:Partial<${model.name}>){

//     if(!(await this.exists(${pk},${ck}))){
//       return {message:"Record not found",updated:false};
//     }

//     const clean = this.cleanData(data);
//     const keys = Object.keys(clean);

//     if(!keys.length){
//       return {message:"Nothing to update",updated:false};
//     }

//     await this.execute(
//       \`UPDATE ${table}
//        SET \${keys.map(k=>\`\${k}=?\`).join(",")}
//        WHERE ${pk}=? AND ${ck}=?\`,
//       [...keys.map(k=>(clean as any)[k]), this.toPK(${pk}), ${ck}]
//     );

//     return {message:"update_one success",updated:true};
//   }

//   async update_all(rows:any[] = [],data:Partial<${model.name}>){
//     if(!rows.length) return {message:"No rows provided",count:0};

//     await Promise.all(
//       rows.map(r=>this.update_one(r.${pk},r.${ck},data))
//     );

//     return {message:"update_all success",count:rows.length};
//   }

//   async update_by(condition:any,data:Partial<${model.name}>){
//     const rows = await this.find_ids(condition);

//     if(!rows.length){
//       return {message:"No records found",updated:0};
//     }

//     await Promise.all(
//       rows.map(r=>this.update_one(r.${pk},r.${ck},data))
//     );

//     return {message:"update_by success",updated:rows.length};
//   }

//   async soft_delete(${pk}:string,${ck}:string){
//     return this.update_one(${pk},${ck},{isDeleted:true} as any);
//   }

//   /* ================= FIND IDS ================= */

//   private async find_ids(condition:any): Promise<any[]>{

//     const queries = this.buildConditions(condition);
//     if(!queries.length) return [];

//     const rows:any[] = [];

//     for(const q of queries){

//       const res = await this.execute(
//         \`SELECT ${pk},${ck} FROM ${table}
//          WHERE \${q.clause} ALLOW FILTERING\`,
//         q.values
//       );

//       for(const r of res.rows){
//         rows.push({
//           ${pk}: r.${pk}.toString(),
//           ${ck}: r.${ck}
//         });
//       }
//     }

//     return rows;
//   }

//   /* ================= DELETE ================= */

//   async delete_one(${pk}:string,${ck}:string){

//     if(!(await this.exists(${pk},${ck}))){
//       return {message:"Record not found",deleted:false};
//     }

//     await this.execute(
//       "DELETE FROM ${table} WHERE ${pk}=? AND ${ck}=?",
//       [this.toPK(${pk}),${ck}]
//     );

//     return {message:"delete_one success",deleted:true};
//   }

//   async delete_by(condition:any){

//     const rows = await this.find_ids(condition);

//     if(!rows.length){
//       return {message:"No records found",deleted:0};
//     }

//     await Promise.all(
//       rows.map(r=>this.delete_one(r.${pk},r.${ck}))
//     );

//     return {message:"delete_by success",deleted:rows.length};
//   }

//   async delete_all(){
//     await this.execute("TRUNCATE ${table}");
//     this.cache.clear();
//     return {message:"delete_all success"};
//   }

// }
// `;
// }









import { ModelNode } from "../../core_db/scylla.parser";

export function buildRepository(model: ModelNode): string {

  const table = model.name.toLowerCase();
  const pk = model.partitionKey[0];
  const ck = model.clusteringKey?.[0];

  const fields = model.fields.map(f => `"${f.name}"`).join(",");

  return `
import { Injectable } from "@nestjs/common";
import { client } from "../src/client";
import { ${model.name} } from "./types";
import { types } from "cassandra-driver";

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as stream from "stream";
import { promisify } from "util";

const pipeline = promisify(stream.pipeline);

@Injectable()
export class ${model.name}Repository {

  private allowedFields:string[]=[${fields}];

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

  private cleanData(data:Partial<${model.name}>){
    return Object.fromEntries(
      Object.entries(data).filter(
        ([k,v]) =>
          v!==undefined &&
          this.allowedFields.includes(k) &&
          k!=="${pk}" &&
          ${ck ? `k!=="${ck}"` : "true"}
      )
    );
  }

  /* ================= EXISTS ================= */

  private async exists(${pk}:string${ck ? `, ${ck}:string` : ""}){

    const query = "${ck 
      ? `SELECT ${pk} FROM ${table} WHERE ${pk}=? AND ${ck}=?`
      : `SELECT ${pk} FROM ${table} WHERE ${pk}=?`
    }";

    const params = [
      this.toPK(${pk})
      ${ck ? `, ${ck}` : ""}
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
      clauses.push(\`\${k}=?\`);
      values.push(k==="${pk}" ? this.toPK(v) : v);
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
    return \`\${Date.now()}-\${hash}\${ext}\`;
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
      url:\`/uploads/\${fileName}\`
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
        url:\`/uploads/\${fileName}\`
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
      url:\`/uploads/\${fileName}\`
    };
  }

  /* ================= FIND ================= */

  async find_one(${pk}:string${ck ? `, ${ck}:string` : ""}){

    const query = "${ck 
      ? `SELECT * FROM ${table} WHERE ${pk}=? AND ${ck}=?`
      : `SELECT * FROM ${table} WHERE ${pk}=?`
    }";

    const params = [
      this.toPK(${pk})
      ${ck ? `, ${ck}` : ""}
    ];

    const res = await this.execute(query, params);

    if(!res.rows.length)
      return {message:"Record not found",data:[]};

    return {message:"find_one success",data:res.rows};
  }

  async find_cached(${pk}:string${ck ? `, ${ck}:string` : ""}){

    const key = "${ck ? `\${${pk}}-\${${ck}}` : `\${${pk}}`}";

    const cached = this.getCache(key);
    if(cached) return {message:"cache hit",data:cached};

    const result = await this.find_one(${pk}${ck ? `, ${ck}` : ""});

    if(result.data.length){
      this.setCache(key,result.data);
    }

    return result;
  }

  async find_all(){
    const res = await this.execute("SELECT * FROM ${table}");
    return {message:"find_all success",data:res.rows};
  }

  async find_with_pagination(limit=10,pageState?:string){

    const res = await client.execute(
      "SELECT * FROM ${table}",
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
        \`SELECT * FROM ${table} WHERE \${q.clause} ALLOW FILTERING\`,
        q.values
      );

      for(const r of res.rows){
        const key = "${ck ? `\${r.${pk}}-\${r.${ck}}` : `\${r.${pk}}`}";
        results.set(key,r);
      }
    }

    return {
      message:"find_by success",
      data:Array.from(results.values())
    };
  }

  /* ================= INSERT ================= */

async insert_one(data: ${model.name}){

  const payload: any = { ...data };

  // ✅ UUID
  if (!payload.${pk}) {
    payload.${pk} = types.Uuid.random();
  }

  // ✅ CLUSTER KEY
  if (${ck ? `!payload.${ck}` : "false"}) {
    payload.${ck} = new Date();
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
  if (!keys.includes("${pk}")) {
    keys.unshift("${pk}");
  }

  ${ck ? `
  if (!keys.includes("${ck}")) {
    keys.push("${ck}");
  }
  ` : ""}

  const query = \`INSERT INTO ${table} (\${keys.join(",")})
                 VALUES (\${keys.map(()=>"?").join(",")})\`;

  const params = keys.map(k =>
    k === "${pk}"
      ? payload[k]
      : payload[k]
  );

  console.log("QUERY:", query);
  console.log("PARAMS:", params);

  await this.execute(query, params);

  return {
    message:"insert_one success",
    id: payload.${pk}.toString()
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

    const query = "INSERT INTO ${table} (" + keys.join(",") + ") VALUES (" + keys.map(() => "?").join(",") + ")";

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

  async update_one(${pk}:string${ck ? `, ${ck}:string` : ""},data:Partial<${model.name}>){

    if(!(await this.exists(${pk}${ck ? `, ${ck}` : ""}))){
      return {message:"Record not found",updated:false};
    }

    const clean = this.cleanData(data);
    const keys = Object.keys(clean);

    if(!keys.length){
      return {message:"Nothing to update",updated:false};
    }

    const query = \`UPDATE ${table}
      SET \${keys.map(k=>\`\${k}=?\`).join(",")}
      WHERE ${pk}=? ${ck ? `AND ${ck}=?` : ""}\`;

    await this.execute(
      query,
      [
        ...keys.map(k=>(clean as any)[k]),
        this.toPK(${pk})
        ${ck ? `, ${ck}` : ""}
      ]
    );

    return {message:"update_one success",updated:true};
  }

  async update_all(rows:any[] = [], data:Partial<${model.name}>){
    if(!rows.length) return {message:"No rows provided",count:0};

    await Promise.all(
      rows.map(r => this.update_one(r.${pk}${ck ? `, r.${ck}` : ""}, data))
    );

    return {message:"update_all success",count:rows.length};
  }

  async update_by(condition:any, data:Partial<${model.name}>){
    const rows = await this.find_ids(condition);

    if(!rows.length){
      return {message:"No records found",updated:0};
    }

    await Promise.all(
      rows.map(r => this.update_one(r.${pk}${ck ? `, r.${ck}` : ""}, data))
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
        \`SELECT ${pk}${ck ? `, ${ck}` : ""} FROM ${table}
         WHERE \${q.clause} ALLOW FILTERING\`,
        q.values
      );

      for(const r of res.rows){
        rows.push({
          ${pk}: r.${pk}.toString()
          ${ck ? `, ${ck}: r.${ck}` : ""}
        });
      }
    }

    return rows;
  }

  /* ================= DELETE ================= */

  async delete_one(${pk}:string${ck ? `, ${ck}:string` : ""}){

    if(!(await this.exists(${pk}${ck ? `, ${ck}` : ""}))){
      return {message:"Record not found",deleted:false};
    }

    const query = "DELETE FROM ${table} WHERE ${pk}=? ${ck ? `AND ${ck}=?` : ""}";

    await this.execute(
      query,
      [this.toPK(${pk}) ${ck ? `, ${ck}` : ""}]
    );

    return {message:"delete_one success",deleted:true};
  }

  async delete_by(condition:any){

    const rows = await this.find_ids(condition);

    if(!rows.length){
      return {message:"No records found",deleted:0};
    }

    await Promise.all(
      rows.map(r => this.delete_one(r.${pk}${ck ? `, r.${ck}` : ""}))
    );

    return {message:"delete_by success",deleted:rows.length};
  }

  async delete_all(){
    await this.execute("TRUNCATE ${table}");
    this.cache.clear();
    return {message:"delete_all success"};
  }

}
`;
}

function VALUES($: any, arg1: { keys: any; "": any; }) {
  throw new Error("Function not implemented.");
}
