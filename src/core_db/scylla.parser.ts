import fs from "fs";
import path from "path";

/* ================================
   TYPES
================================ */

export interface GeneratorNode {
  provider: string;
}

export interface DatasourceNode {
  provider: string;
  host: string;
  port: number;
  keyspace: string;
}

export interface FieldAttributes {
  pk?: boolean;
  partition?: boolean;
  clustering?: "asc" | "desc";
  unique?: boolean;
  index?: boolean;
  default?: any;
  ttl?: number;
}

export interface FieldNode {
  name: string;
  type: string;
  isOptional: boolean;
  isArray: boolean;
  isMap?: boolean;
  mapKeyType?: string;
  mapValueType?: string;

  attributes: FieldAttributes;

  // derived helpers
  isUnique: boolean;
  isIndex: boolean;
  ttl?: number;
}

export interface TypeNode {
  name: string;
  fields: FieldNode[];
}

export interface ModelNode {
  name: string;
  fields: FieldNode[];
  partitionKey: string[];
  clusteringKey: string[];
}

export interface SchemaAST {
  generator?: GeneratorNode;
  datasource?: DatasourceNode;
  types: TypeNode[];
  models: ModelNode[];
}

/* ================================
   BLOCK SCANNER
================================ */

type BlockKind = "generator" | "datasource" | "type" | "model";

interface SchemaBlock {
  kind: BlockKind;
  name: string;
  body: string[];
}

function scanBlocks(schema: string): SchemaBlock[] {
  const lines = schema.split("\n");
  const blocks: SchemaBlock[] = [];

  let current: SchemaBlock | null = null;
  let braceCount = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("//")) continue;

    if (!current) {
      const match = line.match(
        /^(generator|datasource|type|model)\s+(\w+)\s*\{/
      );

      if (match) {
        current = {
          kind: match[1] as BlockKind,
          name: match[2],
          body: [],
        };
        braceCount = 1;
      }

      continue;
    }

    if (line.includes("{")) braceCount++;
    if (line.includes("}")) braceCount--;

    if (braceCount === 0) {
      blocks.push(current);
      current = null;
      continue;
    }

    current.body.push(line);
  }

  return blocks;
}

/* ================================
   FIELD PARSER (FIXED)
================================ */

function parseField(line: string): FieldNode | null {
  if (!line || line.startsWith("//") || line.startsWith("@@")) {
    return null;
  }

  const parts = line.split(/\s+/);
  if (parts.length < 2) return null;

  const name = parts[0];
  let rawType = parts[1];

  let isOptional = false;
  let isArray = false;

  // Optional
  if (rawType.endsWith("?")) {
    isOptional = true;
    rawType = rawType.slice(0, -1);
  }

  // Array
  if (rawType.endsWith("[]")) {
    isArray = true;
    rawType = rawType.replace("[]", "");
  }

  /* ================================
     MAP TYPE SUPPORT
  ================================= */
  let isMap = false;
  let mapKeyType = "";
  let mapValueType = "";

  const mapMatch = rawType.match(/map<(.*?),(.*?)>/i);
  if (mapMatch) {
    isMap = true;
    mapKeyType = mapMatch[1].trim();
    mapValueType = mapMatch[2].trim();
    rawType = "map";
  }

  /* ================================
     ATTRIBUTES
  ================================= */
  const attributes: FieldAttributes = {};

  const attrMatches = line.match(/@\w+(\((.*?)\))?/g);

  if (attrMatches) {
    for (const attr of attrMatches) {
      const clean = attr.replace("@", "");
      const [key, rawValue] = clean.split("(");

      const value = rawValue?.replace(")", "").trim();

      switch (key) {
        case "pk":
          attributes.pk = true;
          break;
        case "partition":
          attributes.partition = true;
          break;
        case "clustering":
          attributes.clustering = value as "asc" | "desc";
          break;
        case "unique":
          attributes.unique = true;
          break;
        case "index":
          attributes.index = true;
          break;
        case "default":
          attributes.default = value;
          break;
        case "ttl":
          attributes.ttl = Number(value);
          break;
        default:
          attributes[key as keyof FieldAttributes] = value || true;
      }
    }
  }

  /* ================================
     FINAL RETURN (FIXED)
  ================================= */
  return {
    name,
    type: rawType,
    isOptional,
    isArray,
    isMap,
    mapKeyType,
    mapValueType,
    attributes,

    // derived fields
    isUnique: !!attributes.unique,
    isIndex: !!attributes.index,
    ttl: attributes.ttl,
  };
}

/* ================================
   PARSERS
================================ */

function parseGenerator(body: string[]): GeneratorNode {
  const line = body.find((l) => l.startsWith("provider"));
  if (!line) throw new Error("Generator must define provider");

  return {
    provider: line.split("=").pop()?.trim().replace(/"/g, "")!,
  };
}

function parseDatasource(body: string[]): DatasourceNode {
  const get = (key: string) => {
    const value = body
      .find((l) => l.startsWith(key))
      ?.split("=")
      .pop()
      ?.trim()
      .replace(/"/g, "");

    if (!value) throw new Error(`Missing datasource field: ${key}`);
    return value;
  };

  return {
    provider: get("provider"),
    host: get("host"),
    port: Number(get("port")),
    keyspace: get("keyspace"),
  };
}

function parseType(name: string, body: string[]): TypeNode {
  return {
    name,
    fields: body.map(parseField).filter(Boolean) as FieldNode[],
  };
}

function parseModel(name: string, body: string[]): ModelNode {
  const fields: FieldNode[] = [];
  let partitionKey: string[] = [];
  let clusteringKey: string[] = [];

  for (const line of body) {
    if (line.startsWith("@@partitionKey")) {
      partitionKey = extractKeys(line);
    } else if (line.startsWith("@@clusteringKey")) {
      clusteringKey = extractKeys(line);
    } else {
      const f = parseField(line);
      if (f) fields.push(f);
    }
  }

  if (partitionKey.length === 0) {
    throw new Error(`❌ Model "${name}" must have partition key`);
  }

  return {
    name,
    fields,
    partitionKey,
    clusteringKey,
  };
}

function extractKeys(line: string): string[] {
  return (
    line
      .match(/\[(.*?)\]/)?.[1]
      .split(",")
      .map((k) => k.trim()) || []
  );
}

/* ================================
   ENTRY
================================ */

export function parseSchema(filePath: string): SchemaAST {
  const schema = fs.readFileSync(path.resolve(filePath), "utf-8");
  const blocks = scanBlocks(schema);

  const ast: SchemaAST = {
    types: [],
    models: [],
  };

  for (const block of blocks) {
    switch (block.kind) {
      case "generator":
        ast.generator = parseGenerator(block.body);
        break;
      case "datasource":
        ast.datasource = parseDatasource(block.body);
        break;
      case "type":
        ast.types.push(parseType(block.name, block.body));
        break;
      case "model":
        ast.models.push(parseModel(block.name, block.body));
        break;
    }
  }

  return ast;
}