// src/models/Items.ts
import { Schema, model, InferSchemaType } from "mongoose";

const AttributesSchema = new Schema({}, { strict: false, _id: false }); // accept any keys

const ItemSchema = new Schema({
  itemId:       { type: String, required: true, unique: true, index: true },
  locationName: { type: String, required: true },
  description:  { type: String, default: "" },
  attributes:   { type: AttributesSchema, default: {} },
  image:        { type: Object, default: null }, // optional if you add bucket/key later
}, { timestamps: true });

export type ItemDoc = InferSchemaType<typeof ItemSchema>;
export const Item = model<ItemDoc>("Item", ItemSchema);