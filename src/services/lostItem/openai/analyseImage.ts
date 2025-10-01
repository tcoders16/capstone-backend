// src/services/lostItem/openai/analyseImage.ts
import { getOpenAI } from "../../../client/openai";
import { itemsRepo } from "../../../repositories/lostItem/items.repo";
import type { ItemAttributes } from "../../../types/items";


export async function analyzeImage(input: {
  itemId: string;
  imageUrl?: string;            // public URL
  imageBase64?: string;         // raw base64 (no data: prefix)
  detail?: "low" | "high" | "auto";
  prompt?: string;
}) {
  const { itemId, imageUrl, imageBase64, detail = "auto", prompt } = input;
  if (!imageUrl && !imageBase64) throw new Error("Provide imageUrl or imageBase64");

  const openai = getOpenAI();

  // Build image part
  const imagePart: any = { type: "input_image", detail };
  imagePart.image_url = imageUrl ?? `data:image/jpeg;base64,${imageBase64}`;

  // Ask the model to RETURN JSON (no response_format)
  const resp = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [{
      role: "user",
      content: [
        {
          type: "input_text",
          text:
            (prompt ??                
                
                `You are assisting a transit lost-and-found.

                Analyze the image and return EXACTLY ONE JSON object, with these keys ONLY (no extra keys, no comments, no markdown, no code fences):

                {
                "category": "electronics|clothing|accessory|document|other",
                "brand": "",
                "model": "",
                "color": "",
                "material": "",
                "shape": "",
                "size": "small|medium|large",
                "condition": "new|used|worn|damaged",
                "text": "",
                "serialNumber": "",
                "labels": [],
                "summary": "",
                "keywords": [],
                "distinctiveFeatures": [],
                "confidence": 0
                }

                Rules:
                - If unknown, use "" for strings and [] for arrays.
                - "labels", "keywords", and "distinctiveFeatures" are arrays of strings.
                - "confidence" is a number between 0 and 1.
                - Do NOT wrap the JSON in backticks or prose.
                - Output MUST be valid JSON UTF-8 with double-quoted keys/strings.
                `.trim())


        },
        imagePart,
      ],
    }],
    temperature: 0.2,
  });

  // Try to parse JSON from the model’s text output
  const raw = (resp.output_text ?? "").trim();

  let attributes: ItemAttributes | undefined;
  try {
    // Model often returns the JSON directly
    attributes = JSON.parse(raw) as ItemAttributes;
  } catch {
    // If it wrapped JSON in code fences or added text, try to extract the first {...} block
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        attributes = JSON.parse(match[0]) as ItemAttributes;
      } catch { /* ignore */ }
    }
  }

  // Final fallback: just store a summary string
  const now = new Date().toISOString();
  if (!attributes) {
    await itemsRepo.update(itemId, {
      attributes: { summary: raw } as ItemAttributes,
      status: "processed",
      updatedAt: now,
    });
    return { ok: true as const, itemId, attributes: { summary: raw } as ItemAttributes };
  }

  await itemsRepo.update(itemId, {
    attributes,
    status: "processed",
    updatedAt: now,
  });

  return { ok: true as const, itemId, attributes };
}


