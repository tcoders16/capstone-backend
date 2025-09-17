// src/db.ts
import { PrismaClient } from "@prisma/client";

// create a single PrismaClient instance
export const prisma = new PrismaClient();
console.log("Prisma connected with DB URL:", process.env.DATABASE_URL);
// (optional) hook to log queries in dev mode
// if (process.env.NODE_ENV !== "production") {
//   prisma.$on("query", (e) => {
//     console.log("Query: " + e.query);
//     console.log("Params: " + e.params);
//   });
// }