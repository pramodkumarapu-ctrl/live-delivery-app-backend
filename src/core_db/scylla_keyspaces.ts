import { Client } from "cassandra-driver";

interface KeyspaceOptions {
  replicationClass?: "SimpleStrategy" | "NetworkTopologyStrategy";
  replicationFactor?: number;
  datacenters?: Record<string, number>;
  durableWrites?: boolean;
  dryRun?: boolean;
}

/**

 */
export async function ensureKeyspace(
  client: Client,
  keyspace: string,
  options: KeyspaceOptions = {}
): Promise<boolean> {
  const {
    replicationClass = "SimpleStrategy",
    replicationFactor = 1,
    datacenters = { datacenter1: 1 },
    durableWrites = true,
    dryRun = false,
  } = options;

  /* =========================================
     STEP 1: CHECK EXISTENCE
  ========================================= */
  const result = await client.execute(
    `SELECT keyspace_name
     FROM system_schema.keyspaces
     WHERE keyspace_name = ?`,
    [keyspace]
  );

  if (result.rowLength > 0) {
    console.log(`✅ Keyspace "${keyspace}" already exists`);
    return true;
  }

  /* =========================================
     STEP 2: BUILD REPLICATION CONFIG
  ========================================= */
  let replicationConfig = "";

  if (replicationClass === "SimpleStrategy") {
    replicationConfig = `
    {
      'class': 'SimpleStrategy',
      'replication_factor': ${replicationFactor}
    }`;
  } else {
    const dcConfig = Object.entries(datacenters)
      .map(([dc, rf]) => `'${dc}': ${rf}`)
      .join(",\n");

    replicationConfig = `
    {
      'class': 'NetworkTopologyStrategy',
      ${dcConfig}
    }`;
  }

  /* =========================================
     STEP 3: GENERATE CQL
  ========================================= */
  const cql = `
CREATE KEYSPACE IF NOT EXISTS ${keyspace}
WITH replication = ${replicationConfig}
AND durable_writes = ${durableWrites};
`.trim();

  console.log("📜 Planned keyspace creation:\n");
  console.log(cql + "\n");

  /* =========================================
     STEP 4: PRODUCTION SAFETY CHECK
  ========================================= */
  if (process.env.NODE_ENV === "production") {
    if (replicationClass === "SimpleStrategy") {
      throw new Error(
        "❌ SimpleStrategy is NOT allowed in production. Use NetworkTopologyStrategy."
      );
    }
  }

  if (dryRun) {
    console.log("ℹ️ Dry run enabled, skipping execution");
    return false;
  }

  /* =========================================
     STEP 5: EXECUTE
  ========================================= */
  await client.execute(cql);

  console.log(`✅ Keyspace "${keyspace}" created successfully`);
  return true;
}