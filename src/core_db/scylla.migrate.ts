import { Client } from "cassandra-driver";
import fs from "fs";
import path from "path";

const MIGRATIONS_TABLE = "scylla_migrations";

export async function ensureMigrationTable(client: Client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id text PRIMARY KEY,
      applied_at timestamp
    )
  `);
}

export async function getAppliedMigrations(client: Client): Promise<Set<string>> {
  const result = await client.execute(
    `SELECT id FROM ${MIGRATIONS_TABLE}`
  );
  return new Set(result.rows.map((r) => r.id));
}

export function readMigrationFiles(dir: string) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".cql"))
    .sort();
}

export async function applyMigrations(
  client: Client,
  migrationsDir: string
) {
  await ensureMigrationTable(client);

  const applied = await getAppliedMigrations(client);
  const files = readMigrationFiles(migrationsDir);

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`⏩ Skipping ${file}`);
      continue;
    }

    console.log(`🚀 Applying ${file}`);

    const fullPath = path.join(migrationsDir, file);
    const cql = fs.readFileSync(fullPath, "utf-8");

    const statements = cql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await client.execute(stmt);
    }

    await client.execute(
      `INSERT INTO ${MIGRATIONS_TABLE} (id, applied_at) VALUES (?, ?)`,
      [file, new Date()]
    );

    console.log(`✅ Applied ${file}`);
  }
}