// src/services/mongoDB/saveAnalysedItem.service.ts
import { Item } from "../../../models/Items";

type SaveArgs = {
  itemId: string;
  location: string;     // from payload.location
  desc?: string;        // from payload.desc
  attributes?: any;     // your attributes blob
  image?: any;          // optional { bucket, key, s3Uri }
};

export async function saveAnalysedItemService({ itemId, location, desc = "", attributes = {}, image }: SaveArgs) {
  return Item.findOneAndUpdate(
    { itemId },
    {
      $set: {
        itemId,
        locationName: location.trim(),
        description: (desc ?? "").trim(),
        attributes,
        ...(image ? { image } : {}),
      },
    },
    { upsert: true, new: true }
  );
}