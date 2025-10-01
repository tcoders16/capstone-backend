// src/client/mongodb.ts
import mongoose from "mongoose";

let ready: Promise<typeof mongoose> | null = null;

export function connectMongo() {
  if (ready) return ready;
  const uri = process.env.MONGODB_URI!;
  if (!uri) throw new Error("Missing MONGODB_URI");
  mongoose.set("strictQuery", true);
  ready = mongoose.connect(uri, { dbName: "lostfound" });
  return ready;
}