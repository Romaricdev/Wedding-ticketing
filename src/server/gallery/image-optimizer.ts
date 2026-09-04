import path from "node:path";
import sharp from "sharp";

export const MAX_GALLERY_IMAGE_BYTES = 5 * 1024 * 1024;

export type OptimizedGalleryImage = {
  bytes: Uint8Array;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  filename: string;
  optimized: boolean;
};

const optimizationSteps = [
  { width: 3200, quality: 90 },
  { width: 2800, quality: 86 },
  { width: 2400, quality: 82 },
  { width: 2000, quality: 78 },
  { width: 1600, quality: 74 },
  { width: 1280, quality: 70 },
];

function webpFilename(filename: string): string {
  const extension = path.extname(filename);
  const base = path.basename(filename, extension) || "photo";
  return `${base.slice(0, 240)}.webp`;
}

export async function optimizeGalleryImage(params: {
  bytes: Uint8Array;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  filename: string;
}): Promise<OptimizedGalleryImage> {
  if (params.bytes.byteLength <= MAX_GALLERY_IMAGE_BYTES) {
    return { ...params, optimized: false };
  }

  const source = sharp(params.bytes, {
    failOn: "error",
    limitInputPixels: 50_000_000,
  }).rotate();
  for (const step of optimizationSteps) {
    const output = await source
      .clone()
      .resize({ width: step.width, withoutEnlargement: true })
      .webp({ quality: step.quality, effort: 5, smartSubsample: true })
      .toBuffer();
    if (output.byteLength <= MAX_GALLERY_IMAGE_BYTES) {
      return {
        bytes: new Uint8Array(output),
        mimeType: "image/webp",
        filename: webpFilename(params.filename),
        optimized: true,
      };
    }
  }

  throw new Error(
    "La photo ne peut pas être optimisée sous 5 Mo sans devenir trop petite.",
  );
}
