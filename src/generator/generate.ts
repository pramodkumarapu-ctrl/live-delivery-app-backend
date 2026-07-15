import { parseSchema } from "../core_db/scylla.parser";
import { generateModuleFiles } from "./nest.generator";


export async function runGenerator() {
  console.log("🚀 Generating...");

  const schema = parseSchema("schema.scylla");

  for (const model of schema.models) {
    await generateModuleFiles(model);
  }

  console.log("🎉 All modules generated");
}