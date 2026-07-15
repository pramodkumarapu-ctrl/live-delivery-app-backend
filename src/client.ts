
// import { Client } from "cassandra-driver";

// export const client = new Client({
//   contactPoints: ["127.0.0.1"],
//   localDataCenter: "datacenter1",
//   keyspace: "live_tracking_app_keyspace"
// });
import { Client, auth } from "cassandra-driver";

// Product-ready ScyllaDB client configuration
export const client = new Client({
  contactPoints: ["127.0.0.1"], // Replace with your ScyllaDB nodes
  localDataCenter: "datacenter1",
  keyspace: "live_delivery_app",
  // ScyllaDB performs best with 'prepare: true' globally or per-query
  queryOptions: { prepare: true },
  /* Optional: Authentication
  authProvider: new auth.PlainTextAuthProvider(
    process.env.SCYLLA_USER!,
    process.env.SCYLLA_PASS!
  ),
  */
});

// Helper to ensure connection is ready
export async function connectScylla() {
  try {
    await client.connect();
    console.log("Connected to ScyllaDB Cluster");
  } catch (err) {
    console.error("ScyllaDB Connection Failed:", err);
    process.exit(1);
  }
}