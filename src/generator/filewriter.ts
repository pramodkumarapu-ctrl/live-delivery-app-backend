
import fs from "fs-extra";
import path from "path";
import { ModelNode } from "../core_db/scylla.parser";

/* =====================================================
   MAIN ENTRY
===================================================== */
export async function writeFiles(schema: { models: ModelNode[] }) {

  const baseDir = path.resolve("generated");

  await fs.ensureDir(baseDir);
  await fs.ensureDir(path.join(baseDir, "repositories"));
  await fs.ensureDir(path.join(baseDir, "types"));
  await fs.ensureDir(path.join(baseDir, "delegates"));

  const exports: string[] = [];

  for (const model of schema.models) {

    const name = model.name;
    const fileName = name.toLowerCase();

    /* ================= TYPES ================= */

    const typeFile = generateType(model);

    const typePath = path.join(baseDir, "types", `${fileName}.ts`);
    await fs.writeFile(typePath, typeFile);

    exports.push(`export * from "./types/${fileName}";`);

    /* ================= REPOSITORY ================= */

    const repoFile = generateRepositoryStub(model);

    const repoPath = path.join(baseDir, "repositories", `${fileName}.repository.ts`);
    await fs.writeFile(repoPath, repoFile);

    exports.push(`export * from "./repositories/${fileName}.repository";`);

    /* ================= DELEGATE ================= */

    const delegateFile = generateDelegate(model);

    const delegatePath = path.join(baseDir, "delegates", `${fileName}.delegate.ts`);
    await fs.writeFile(delegatePath, delegateFile);

    exports.push(`export * from "./delegates/${fileName}.delegate";`);

    console.log(`✅ Generated ${name}`);
  }

  /* ================= INDEX FILE ================= */

  await fs.writeFile(
    path.join(baseDir, "index.ts"),
    exports.join("\n")
  );

  console.log("📦 Generated index.ts");
}

/* =====================================================
   TYPE GENERATOR
===================================================== */
function generateType(model: ModelNode): string {

  const fields = model.fields
    .map(f => `  ${f.name}${f.isOptional ? "?" : ""}: ${mapTsType(f.type)};`)
    .join("\n");

  return `
export interface ${model.name} {
${fields}
}
`;
}

/* =====================================================
   REPOSITORY STUB (you already have full one)
===================================================== */
function generateRepositoryStub(model: ModelNode): string {

  return `
import { ${model.name} } from "../types/${model.name.toLowerCase()}";

export class ${model.name}Repository {

  async findMany(): Promise<${model.name}[]> {
    return [];
  }

}
`;
}

/* =====================================================
   DELEGATE (PRISMA-LIKE)
===================================================== */
function generateDelegate(model: ModelNode): string {

  return `
import { ${model.name}Repository } from "../repositories/${model.name.toLowerCase()}.repository";

export class ${model.name}Delegate {

  constructor(private repo: ${model.name}Repository) {}

  async findMany() {
    return this.repo.findMany();
  }

  async create(data:any){
    return this.repo.insert_one(data);
  }

  async findOne(pk:any,ck?:any){
    return this.repo.find_one(pk,ck);
  }

  async update(pk:any,ck:any,data:any){
    return this.repo.update_one(pk,ck,data);
  }

  async delete(pk:any,ck:any){
    return this.repo.delete_one(pk,ck);
  }

}
`;
}

/* =====================================================
   TS TYPE MAPPER
===================================================== */
function mapTsType(type: string): string {

  switch (type.toLowerCase()) {
    case "uuid":
    case "text":
    case "string":
      return "string";

    case "int":
    case "float":
    case "double":
      return "number";

    case "boolean":
      return "boolean";

    case "timestamp":
      return "Date";

    default:
      return "any";
  }
}