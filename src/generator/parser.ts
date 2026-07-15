
import path from "path";
import { parseSchema as coreParseSchema } from "../core_db/scylla.parser";
import { SchemaAST } from "../core_db/scylla.parser";

/* =====================================================
   GENERATOR PARSER (WRAPPER)
===================================================== */

export function parseSchema(schemaPath: string): SchemaAST {

  const fullPath = path.resolve(schemaPath);

  const ast = coreParseSchema(fullPath);

  if (!ast.models.length) {
    throw new Error("❌ No models found in schema");
  }

  return ast;
}