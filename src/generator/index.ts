import fs from "fs";
import path from "path";
import { parseSchema } from "../core_db/scylla.parser";
import { buildRepository } from "./crud/repository.generator";

export async function runGenerator() {
  console.log("📄 Reading schema...");

  const schemaPath = path.resolve("scylla/schema.scylla");
  const ast = parseSchema(schemaPath);

  const outputDir = path.resolve("generated");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const model of ast.models) {
    const repoCode = buildRepository(model);

    const filePath = path.join(
      outputDir,
      `${model.name.toLowerCase()}.repository.ts`
    );

    fs.writeFileSync(filePath, repoCode);

    console.log(`✅ Generated ${model.name}Repository`);
  }

  console.log("🎉 Generation completed");
}