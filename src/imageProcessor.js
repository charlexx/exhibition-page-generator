import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

function isUrl(str) {
  return str.startsWith('http://') || str.startsWith('https://');
}

async function processImageField(imagePath, inputDir, outputDir, verbose) {
  if (!imagePath) return null;
  if (isUrl(imagePath)) return imagePath;

  const absPath = path.resolve(inputDir, imagePath);
  if (!existsSync(absPath)) {
    console.warn(`  Warning: Image not found: ${absPath}`);
    return null;
  }

  const imagesDir = path.join(outputDir, 'images');
  await mkdir(imagesDir, { recursive: true });

  const filename = path.basename(absPath);
  const destPath = path.join(imagesDir, filename);
  await copyFile(absPath, destPath);

  if (verbose) {
    console.log(`  Copied: ${absPath} → ${destPath}`);
  }

  return `images/${filename}`;
}

export async function processImages(data, inputDir, outputDir, verbose = false) {
  const processed = structuredClone(data);

  for (const artist of processed.artists || []) {
    if (artist.photo) {
      artist.photo = await processImageField(artist.photo, inputDir, outputDir, verbose);
    }
  }

  for (const artwork of processed.artworks || []) {
    if (artwork.image) {
      artwork.image = await processImageField(artwork.image, inputDir, outputDir, verbose);
    }
  }

  if (processed.curator?.photo) {
    processed.curator.photo = await processImageField(processed.curator.photo, inputDir, outputDir, verbose);
  }

  return processed;
}
