// import { randomUUID } from "crypto";
// // import { UserRepository } from "generated/user.repository";


// async function main() {

//   const repo = new UserRepository();

//   const userId = randomUUID();
//   const createdAt = new Date(); // clustering key

//   /* ================= CREATE ================= */
//   console.log("🚀 Creating user...");

//   await repo.insert_one({
//     id: userId,
//     name: "Pramod",
//     email: "test@test.com",
//     phone: "9999999999",
//     role: "customer",
//     is_premium: false,
//     dietary_prefs: ["Veg"],
//     created_at: createdAt
//   });

//   console.log("✅ User Created");


//   /* ================= FIND ONE ================= */
//   const user = await repo.find_one(userId, createdAt);
//   console.log("FindOne:", user.data);


//   /* ================= FIND ALL (ONLY FOR TEST) ================= */
//   const users = await repo.find_all();
//   console.log("FindAll:", users.data);


//   /* ================= UPDATE ================= */
//   await repo.update_one(userId, createdAt, {
//     name: "Updated Name"
//   });

//   console.log("✅ Updated");

//   const updated = await repo.find_one(userId, createdAt);
//   console.log("After Update:", updated.data);


//   /* ================= DELETE ================= */
//   await repo.delete_one(userId, createdAt);
//   console.log("✅ Deleted");

//   const afterDelete = await repo.find_one(userId, createdAt);
//   console.log("After Delete:", afterDelete.data);
// }

// main().catch(console.error);