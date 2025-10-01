// // scripts/seed-file.ts
// import "dotenv/config";
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();

// async function main() {
//   const file = await prisma.fileObject.create({
//     data: {
//       caseId: "demo",
//       originalName: "cap.jpg",
//       mime: "image/jpeg",
//       size: 12345,
//       storage: "LOCAL",
//       keyOrPath: "cap.jpg",
//       demoUrl: "http://localhost:4000/files/cap.jpg",
//       localUrl: "http://localhost:4000/files/cap.jpg",
//     },
//   });
//   console.log("Created FileObject:", file.id);
// }
// main().finally(() => prisma.$disconnect());