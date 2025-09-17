// src/services/lostItem/saveAttributesToDB.ts
import { prisma } from "../../client/db";             // adjust path if needed

import type { ItemAttributes } from "../../types/items";

export async function saveAttributesToDB(itemId: string, attributes: ItemAttributes) {
  // create an Analysis record with full JSON payload
  const created = await prisma.analysis.create({
    data: {
      fileId: itemId,
      type: "Classifier",
      version: "v1",
      status: "COMPLETED",
      confidence: attributes.confidence ?? null,
      data: attributes,
    },
    select: { id: true }
  });

  // update FileObject with denormalized fields
  await prisma.fileObject.update({
    where: { id: itemId },
    data: {
      category: attributes.category ?? null,
      brand: attributes.brand ?? null,
      model: attributes.model ?? null,
      color: attributes.color ?? null,
      material: attributes.material ?? null,
      shape: attributes.shape ?? null,
      sizeLabel: attributes.size ?? null,
      condition: attributes.condition ?? null,
      text: attributes.text ?? null,
      serialNumber: attributes.serialNumber ?? null,
      labels: attributes.labels ?? [],
      summary: attributes.summary ?? null,
      keywords: attributes.keywords ?? [],
      distinctiveFeatures: attributes.distinctiveFeatures ?? [],
      confidence: attributes.confidence ?? null,
      latestAnalysisId: created.id,
    }
  });
}