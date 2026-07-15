
import { runGenerator } from "./generator/generate";

/* =====================================================
   MAIN ENTRY
===================================================== */
async function main() {
  try {
    console.log("🚀 Scylla Generator Starting...");
    await runGenerator();
    console.log("🎉 Done");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();