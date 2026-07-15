
import { SCYLLA_TYPE_MAP } from "../utils/scylla_datatypes";
import { FieldNode, ModelNode, TypeNode } from "./scylla.parser";


/* =====================================================
   🔹 TYPE RESOLVER
===================================================== */
function resolveScyllaType(field: FieldNode): string {
  const baseType =
    SCYLLA_TYPE_MAP[field.type as keyof typeof SCYLLA_TYPE_MAP] ??
    field.type.toLowerCase();

  if (field.isArray) {
    return `LIST<${baseType}>`;
  }

  return baseType;
}

/* =====================================================
   🔹 CREATE TYPE (UDT)
===================================================== */
export function generateCreateType(type: TypeNode): string {
  const fields = type.fields
    .map((f) => `${f.name} ${resolveScyllaType(f)}`)
    .join(",\n  ");

  return `
CREATE TYPE IF NOT EXISTS ${type.name.toLowerCase()} (
  ${fields}
);
`.trim();
}

/* =====================================================
   🔹 CREATE TABLE
===================================================== */
export function generateCreateTable(model: ModelNode): string {
  const columns = model.fields
    .map((f) => `${f.name} ${resolveScyllaType(f)}`)
    .join(",\n  ");

  const partitionKey = `(${model.partitionKey.join(", ")})`;

  const clusteringKey =
    model.clusteringKey.length > 0
      ? `, ${model.clusteringKey.join(", ")}`
      : "";

  /* 🔥 CLUSTERING ORDER */
  const clusteringOrder =
    model.clusteringKey.length > 0
      ? `
WITH CLUSTERING ORDER BY (${model.clusteringKey
          .map((k) => `${k} DESC`)
          .join(", ")})`
      : "";

  /* 🔥 TTL SUPPORT */
  const ttlField = model.fields.find((f) => f.ttl);
  const ttlOption = ttlField
    ? ` AND default_time_to_live = ${ttlField.ttl}`
    : "";

  return `
CREATE TABLE IF NOT EXISTS ${model.name.toLowerCase()} (
  ${columns},
  PRIMARY KEY ${partitionKey}${clusteringKey}
)
${clusteringOrder}${ttlOption};
`.trim();
}

/* =====================================================
   🔹 CREATE INDEXES
===================================================== */
export function generateIndexes(model: ModelNode): string[] {
  const queries: string[] = [];

  for (const field of model.fields) {
    if (field.isUnique || field.isIndex) {
      queries.push(`
CREATE INDEX IF NOT EXISTS ON ${model.name.toLowerCase()} (${field.name});
`.trim());
    }
  }

  return queries;
}

/* =====================================================
   🔹 ADD COLUMN (SAFE)
===================================================== */
export function generateAddColumn(
  table: string,
  field: FieldNode
): string {
  return `
ALTER TABLE ${table.toLowerCase()}
ADD ${field.name} ${resolveScyllaType(field)};
`.trim();
}

/* =====================================================
   🔹 DROP TABLE (BLOCK IN PROD)
===================================================== */
export function generateDropTable(
  table: string,
  force = false
): string {
  if (process.env.NODE_ENV === "production" && !force) {
    throw new Error(
      `❌ Cannot drop table "${table}" in production without --force`
    );
  }

  return `DROP TABLE IF EXISTS ${table.toLowerCase()};`;
}

/* =====================================================
   🔹 FULL GENERATOR (TABLE + INDEXES)
===================================================== */
export function generateFullTable(model: ModelNode): string[] {
  const queries: string[] = [];

  queries.push(generateCreateTable(model));

  const indexes = generateIndexes(model);
  queries.push(...indexes);

  return queries;
}