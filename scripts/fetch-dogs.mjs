#!/usr/bin/env node
/**
 * Downloads dog breed photos from the Dog CEO API (dog.ceo) to public/dogs/
 * so the app can serve them from its own origin. This removes any dependency
 * on external image CDNs that may be filtered on some Russian ISPs without VPN.
 *
 * Runs as a prebuild step: if a file already exists, it's skipped.
 * The Dog CEO API returns a random image from the Stanford Dogs Dataset.
 */
import { mkdirSync, existsSync, createWriteStream, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'dogs');
mkdirSync(OUT_DIR, { recursive: true });

// Mirror of src/data/dogBreeds.ts — keep in sync.
const BREEDS = [
  { id: 'labrador', apiPath: 'labrador' },
  { id: 'golden-retriever', apiPath: 'retriever/golden' },
  { id: 'german-shepherd', apiPath: 'german/shepherd' },
  { id: 'husky', apiPath: 'husky' },
  { id: 'dachshund', apiPath: 'dachshund' },
  { id: 'beagle', apiPath: 'beagle' },
  { id: 'french-bulldog', apiPath: 'bulldog/french' },
  { id: 'english-bulldog', apiPath: 'bulldog/english' },
  { id: 'rottweiler', apiPath: 'rottweiler' },
  { id: 'boxer', apiPath: 'boxer' },
  { id: 'dalmatian', apiPath: 'dalmatian' },
  { id: 'poodle', apiPath: 'poodle/standard' },
  { id: 'corgi', apiPath: 'pembroke' },
  { id: 'doberman', apiPath: 'doberman' },
  { id: 'samoyed', apiPath: 'samoyed' },
  { id: 'pomeranian', apiPath: 'pomeranian' },
  { id: 'chihuahua', apiPath: 'chihuahua' },
  { id: 'yorkshire-terrier', apiPath: 'terrier/yorkshire' },
  { id: 'chow-chow', apiPath: 'chow' },
  { id: 'akita', apiPath: 'akita' },
  { id: 'shiba-inu', apiPath: 'shiba' },
  { id: 'malamute', apiPath: 'malamute' },
  { id: 'border-collie', apiPath: 'collie/border' },
  { id: 'sheltie', apiPath: 'sheepdog/shetland' },
  { id: 'cocker-spaniel', apiPath: 'spaniel/cocker' },
  { id: 'irish-setter', apiPath: 'setter/irish' },
  { id: 'saint-bernard', apiPath: 'stbernard' },
  { id: 'maltese', apiPath: 'maltese' },
  { id: 'miniature-schnauzer', apiPath: 'schnauzer/miniature' },
  { id: 'borzoi', apiPath: 'borzoi' },
  { id: 'malinois', apiPath: 'malinois' },
  { id: 'great-dane', apiPath: 'dane/great' },
  { id: 'pug', apiPath: 'pug' },
  { id: 'weimaraner', apiPath: 'weimaraner' },
  { id: 'rhodesian-ridgeback', apiPath: 'ridgeback/rhodesian' },
];

async function fetchImageUrl(apiPath) {
  const url = `https://dog.ceo/api/breed/${apiPath}/images/random`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from Dog CEO API for ${apiPath}`);
  const json = await res.json();
  if (json.status !== 'success' || !json.message) {
    throw new Error(`Unexpected response from Dog CEO API for ${apiPath}`);
  }
  return json.message;
}

async function downloadImage(imageUrl, outFile) {
  const tmp = outFile + '.part';
  const res = await fetch(imageUrl);
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} downloading ${imageUrl}`);
  await pipeline(res.body, createWriteStream(tmp));
  renameSync(tmp, outFile);
}

const tasks = BREEDS.filter(b => !existsSync(join(OUT_DIR, `${b.id}.jpg`)));

if (tasks.length === 0) {
  console.log('✓ all dog breed photos already present');
  process.exit(0);
}

console.log(`↓ downloading ${tasks.length} dog breed photo(s)…`);

const CONCURRENCY = 4;
let idx = 0;
let ok = 0;
let failed = 0;

await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (idx < tasks.length) {
      const breed = tasks[idx++];
      const outFile = join(OUT_DIR, `${breed.id}.jpg`);
      try {
        const imageUrl = await fetchImageUrl(breed.apiPath);
        await downloadImage(imageUrl, outFile);
        console.log(`  ✓ ${breed.id}`);
        ok++;
      } catch (err) {
        console.error(`  ✗ ${breed.id}: ${err.message}`);
        failed++;
      }
    }
  }),
);

console.log(`done: ${ok} ok, ${failed} failed`);
if (failed > 0) process.exit(1);
