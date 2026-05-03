#!/usr/bin/env node
/**
 * Downloads dog breed photos from Wikipedia breed articles to public/dogs/
 * Wikipedia breed photos are professional, full-body, breed-standard shots.
 * Serves from own origin so photos work in Russia without VPN.
 *
 * Uses the Wikipedia REST summary API to get the breed article's main image,
 * then scales the Wikimedia Commons thumbnail to 1200px wide.
 *
 * Runs as a prebuild step: if a file already exists, it's skipped.
 */
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'dogs');
mkdirSync(OUT_DIR, { recursive: true });

// Maps breed id → Wikipedia article title for the breed's main article.
// Wikipedia breed photos are professionally taken breed-standard photos.
const BREEDS = [
  { id: 'labrador',             wikiTitle: 'Labrador_Retriever' },
  { id: 'golden-retriever',     wikiTitle: 'Golden_Retriever' },
  { id: 'german-shepherd',      wikiTitle: 'German_Shepherd' },
  { id: 'husky',                wikiTitle: 'Siberian_Husky' },
  { id: 'dachshund',            wikiTitle: 'Dachshund' },
  { id: 'beagle',               wikiTitle: 'Beagle' },
  { id: 'french-bulldog',       wikiTitle: 'French_Bulldog' },
  { id: 'english-bulldog',      wikiTitle: 'Bulldog' },
  { id: 'rottweiler',           wikiTitle: 'Rottweiler' },
  { id: 'boxer',                wikiTitle: 'Boxer_(dog)' },
  { id: 'dalmatian',            wikiTitle: 'Dalmatian_(dog)' },
  { id: 'poodle',               wikiTitle: 'Poodle' },
  { id: 'corgi',                wikiTitle: 'Pembroke_Welsh_Corgi' },
  { id: 'doberman',             wikiTitle: 'Dobermann' },
  { id: 'samoyed',              wikiTitle: 'Samoyed_(dog)' },
  { id: 'pomeranian',           wikiTitle: 'Pomeranian_(dog)' },
  { id: 'chihuahua',            wikiTitle: 'Chihuahua_(dog)' },
  { id: 'yorkshire-terrier',    wikiTitle: 'Yorkshire_Terrier' },
  { id: 'chow-chow',            wikiTitle: 'Chow_Chow' },
  { id: 'akita',                wikiTitle: 'Akita_(dog)' },
  { id: 'shiba-inu',            wikiTitle: 'Shiba_Inu' },
  { id: 'malamute',             wikiTitle: 'Alaskan_Malamute' },
  { id: 'border-collie',        wikiTitle: 'Border_Collie' },
  { id: 'sheltie',              wikiTitle: 'Shetland_Sheepdog' },
  { id: 'cocker-spaniel',       wikiTitle: 'English_Cocker_Spaniel' },
  { id: 'irish-setter',         wikiTitle: 'Irish_Setter' },
  { id: 'saint-bernard',        wikiTitle: 'Saint_Bernard_(dog)' },
  { id: 'maltese',              wikiTitle: 'Maltese_dog' },
  { id: 'miniature-schnauzer',  wikiTitle: 'Miniature_Schnauzer' },
  { id: 'borzoi',               wikiTitle: 'Borzoi' },
  { id: 'malinois',             wikiTitle: 'Belgian_Malinois' },
  { id: 'great-dane',           wikiTitle: 'Great_Dane' },
  { id: 'pug',                  wikiTitle: 'Pug' },
  { id: 'weimaraner',           wikiTitle: 'Weimaraner' },
  { id: 'rhodesian-ridgeback',  wikiTitle: 'Rhodesian_Ridgeback' },
];

async function fetchImageUrl(wikiTitle) {
  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
  const res = await fetch(apiUrl, {
    headers: { 'User-Agent': 'MindFitnessApp/1.0 (educational; contact: admin@example.com)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from Wikipedia for ${wikiTitle}`);
  const json = await res.json();
  // Prefer the full original image; fall back to the thumbnail
  return json.originalimage?.source ?? json.thumbnail?.source ?? (() => { throw new Error(`No image for Wikipedia article: ${wikiTitle}`); })();
}

async function downloadImage(imageUrl, outFile) {
  // Use curl with a browser UA — Wikimedia blocks Node.js fetch but allows curl with proper headers
  const tmp = outFile + '.part';
  await execFileAsync('curl', [
    '-fsSL', '--max-time', '30',
    '-A', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    '-e', 'https://en.wikipedia.org/',
    '-o', tmp,
    imageUrl,
  ]);
  await execFileAsync('mv', [tmp, outFile]);
}

const tasks = BREEDS.filter(b => !existsSync(join(OUT_DIR, `${b.id}.jpg`)));

if (tasks.length === 0) {
  console.log('✓ all dog breed photos already present');
  process.exit(0);
}

console.log(`↓ downloading ${tasks.length} dog breed photo(s) from Wikipedia…`);

const sleep = ms => new Promise(r => setTimeout(r, ms));

let ok = 0;
let failed = 0;

for (const breed of tasks) {
  const outFile = join(OUT_DIR, `${breed.id}.jpg`);
  let retries = 3;
  let success = false;
  while (retries-- > 0 && !success) {
    try {
      const imageUrl = await fetchImageUrl(breed.wikiTitle);
      await downloadImage(imageUrl, outFile);
      console.log(`  ✓ ${breed.id}`);
      ok++;
      success = true;
    } catch (err) {
      if (retries > 0) {
        await sleep(3000);
      } else {
        console.error(`  ✗ ${breed.id}: ${err.message}`);
        failed++;
      }
    }
  }
  await sleep(1500);
}

console.log(`done: ${ok} ok, ${failed} failed`);
if (failed > 0) process.exit(1);
