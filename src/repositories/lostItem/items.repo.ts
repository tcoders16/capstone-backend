// // backend/src/repositories/lostItem/items.repo.ts
// import { db } from "../../lib/firebase";

// const COLLECTION = "items";

// /**
//  * Save (create or overwrite) an item document
//  */
// async function save(itemId: string, data: any) {
//   await db.collection(COLLECTION).doc(itemId).set(data, { merge: true });
// }

// /**
//  * Update (partial) an existing item document
//  */
// async function update(itemId: string, data: any) {
//   await db.collection(COLLECTION).doc(itemId).update(data);
// }

// /**
//  * Get a single item by ID
//  */
// async function get(itemId: string) {
//   const doc = await db.collection(COLLECTION).doc(itemId).get();
//   return doc.exists ? { id: doc.id, ...doc.data() } : null;
// }

// /**
//  * List all items
//  */
// async function list() {
//   const snapshot = await db.collection(COLLECTION).get();
//   return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
// }

// export const itemsRepo = { save, update, get, list };


// backend/src/repositories/lostItem/items.repo.ts

// In-memory store
const memoryDB = new Map<string, any>();

async function save(itemId: string, data: any) {
  memoryDB.set(itemId, { id: itemId, ...data });
}

async function update(itemId: string, data: any) {
  const existing = memoryDB.get(itemId);
  if (!existing) throw new Error(`Item ${itemId} not found`);
  memoryDB.set(itemId, { ...existing, ...data });
}

async function get(itemId: string) {
  return memoryDB.get(itemId) ?? null;
}

async function list() {
  return Array.from(memoryDB.values());
}

export const itemsRepo = { save, update, get, list };