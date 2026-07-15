import { Command } from "commander";
import { Client } from "cassandra-driver";
import fs from "fs";
import path from "path";

import { applyMigrations } from "../core_db/scylla.migrate";
import { ensureKeyspace } from "../core_db/scylla_keyspaces";
import { runGenerator } from "../generator";

const program = new Command();

program
  .name("scylla")
  .description("Scylla ODM CLI")
  .version("1.0.0");

/* =====================================================
   ✅ GENERATE
===================================================== */
program
  .command("generate")
  .description("Generate repositories")
  .action(async () => {
    try {
      console.log("🚀 Generating...");
      await runGenerator();
      console.log("✅ Generation completed");
    } catch (err: any) {
      console.error("❌ Generation failed:", err.message);
      process.exit(1);
    }
  });

/* =====================================================
   ✅ CREATE MIGRATION
===================================================== */
program
  .command("migrate:create <name>")
  .description("Create migration file")
  .action((name: string) => {
    const dir = path.resolve("scylla/migrations");

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);

    const fileName = `${timestamp}_${name}.cql`;
    const fullPath = path.join(dir, fileName);

    fs.writeFileSync(
      fullPath,
      `-- Migration: ${name}\n-- Write your CQL here\n`
    );

    console.log(`✅ Created ${fileName}`);
  });

/* =====================================================
   ✅ APPLY MIGRATIONS
===================================================== */
program
  .command("migrate:apply")
  .option("--host <host>", "DB host", "127.0.0.1")
  .option("--keyspace <keyspace>", "Keyspace", "live_delivery_app")
  .action(async (opts) => {
    let admin: Client | null = null;
    let client: Client | null = null;

    try {
      console.log("🔌 Connecting...");

      admin = new Client({
        contactPoints: [opts.host],
        localDataCenter: "datacenter1",
      });

      await admin.connect();

      await ensureKeyspace(admin, opts.keyspace, {
        dryRun: false,
      });

      await admin.shutdown();

      client = new Client({
        contactPoints: [opts.host],
        localDataCenter: "datacenter1",
        keyspace: opts.keyspace,
      });

      await client.connect();

      await applyMigrations(client, "scylla/migrations");

      console.log("🎉 Migrations applied");
    } catch (err: any) {
      console.error("❌ Migration failed:", err.message);
    } finally {
      if (admin) await admin.shutdown().catch(() => {});
      if (client) await client.shutdown().catch(() => {});
    }
  });

/* =====================================================
   ❌ DISABLED
===================================================== */
program.command("db:push").action(() => {
  console.error("❌ Disabled. Use migrations.");
});

program.parse(process.argv);