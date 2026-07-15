/* =====================================================
   🔹 BASE TYPE MAP (Logical → Scylla)
===================================================== */

export const SCYLLA_TYPE_MAP = {
  // 🔤 String Types
  String: "TEXT",
  Text: "TEXT",
  Ascii: "ASCII",

  // 🔢 Number Types
  Int: "INT",
  BigInt: "BIGINT",
  TinyInt: "TINYINT",
  SmallInt: "SMALLINT",
  VarInt: "VARINT",
  Float: "FLOAT",
  Double: "DOUBLE",
  Decimal: "DECIMAL",

  // 🔘 Boolean
  Boolean: "BOOLEAN",

  // 🆔 Identifiers
  UUID: "UUID",
  TimeUUID: "TIMEUUID",

  // 📅 Time Types
  DateTime: "TIMESTAMP",
  Date: "DATE",
  Time: "TIME",

  // 📦 Binary
  Bytes: "BLOB",

  // 📄 JSON (stored as TEXT)
  Json: "TEXT",
} as const;

export type ScyllaLogicalType = keyof typeof SCYLLA_TYPE_MAP;

/* =====================================================
   🔹 REVERSE MAP (Scylla → Logical)
===================================================== */

export const REVERSE_TYPE_MAP: Record<string, ScyllaLogicalType> = {
  TEXT: "String",
  ASCII: "Ascii",

  INT: "Int",
  BIGINT: "BigInt",
  TINYINT: "TinyInt",
  SMALLINT: "SmallInt",
  VARINT: "VarInt",
  FLOAT: "Float",
  DOUBLE: "Double",
  DECIMAL: "Decimal",

  BOOLEAN: "Boolean",

  UUID: "UUID",
  TIMEUUID: "TimeUUID",

  TIMESTAMP: "DateTime",
  DATE: "Date",
  TIME: "Time",

  BLOB: "Bytes",
};

/* =====================================================
   🔹 TYPE RESOLVER (CORE LOGIC)
===================================================== */

export function resolveDbType(
  type: string,
  isArray?: boolean,
  isMap?: boolean,
  mapKeyType?: string,
  mapValueType?: string
): string {
  const base =
    SCYLLA_TYPE_MAP[type as ScyllaLogicalType] ??
    type.toUpperCase(); // fallback for UDT

  // 🔹 MAP SUPPORT
  if (isMap && mapKeyType && mapValueType) {
    const key =
      SCYLLA_TYPE_MAP[mapKeyType as ScyllaLogicalType] ??
      mapKeyType.toUpperCase();

    const value =
      SCYLLA_TYPE_MAP[mapValueType as ScyllaLogicalType] ??
      mapValueType.toUpperCase();

    return `MAP<${key}, ${value}>`;
  }

  // 🔹 ARRAY → LIST
  if (isArray) {
    return `LIST<${base}>`;
  }

  return base;
}

/* =====================================================
   🔹 VALIDATION
===================================================== */

export function isValidLogicalType(type: string): boolean {
  return (
    type in SCYLLA_TYPE_MAP ||
    type.toLowerCase().startsWith("map<") ||
    type.toLowerCase().startsWith("list<") ||
    type.toLowerCase().startsWith("set<")
  );
}

/* =====================================================
   🔹 DEFAULT VALUES (OPTIONAL)
===================================================== */

export function getDefaultValue(type: ScyllaLogicalType): any {
  switch (type) {
    case "String":
    case "Text":
      return "''";

    case "Int":
    case "BigInt":
    case "Float":
    case "Double":
    case "Decimal":
      return 0;

    case "Boolean":
      return false;

    case "UUID":
    case "TimeUUID":
      return "uuid()";

    case "DateTime":
      return "toTimestamp(now())";

    case "Date":
      return "toDate(now())";

    case "Time":
      return "toUnixTimestamp(now())";

    default:
      return null;
  }
}