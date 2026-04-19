#!/usr/bin/env node
/**
 * Downloads the 28 weekly background photos to public/bg/ so the app can serve
 * them from its own origin. This removes any dependency on images.unsplash.com
 * reachability (which is filtered on several Russian ISPs without VPN).
 *
 * Runs as a prebuild step: if a file already exists, it's skipped.
 */
import { mkdirSync, existsSync, createWriteStream, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'bg');
mkdirSync(OUT_DIR, { recursive: true });

// Mirror of src/weeklyPhotos.ts — keep in sync.
const PHOTOS = {
  0: { dawn: '1419242902214-272b3f66ee7a', morning: '1441974231531-c6227db76b6e', afternoon: '1426604966848-d7adac402bff', sunset: '1506815444479-bfdb1e96c566' },
  1: { dawn: '1469474968028-56623f02e42e', morning: '1501785888041-af3ef285b470', afternoon: '1506260408121-e353d10b87c7', sunset: '1495616811223-4d98c6e9c869' },
  2: { dawn: '1542273917363-3b1817f69a2d', morning: '1464822759023-fed622ff2c3b', afternoon: '1470770841072-f978cf4d019e', sunset: '1510784722466-f2aa9c52fff6' },
  3: { dawn: '1500534314209-a25ddb2bd429', morning: '1502082553048-f009c37129b9', afternoon: '1433086966358-54859d0ed716', sunset: '1472214103451-9374bd1c798e' },
  4: { dawn: '1506905925346-21bda4d32df4', morning: '1454496522488-7a8e488e8606', afternoon: '1431631927486-6603c868ce5e', sunset: '1500964757637-c85e8a162699' },
  5: { dawn: '1475924156734-496f6cac6ec1', morning: '1497436072909-60f360e1d4b1', afternoon: '1518837695005-2083093ee35b', sunset: '1483728642387-6c3bdd6c93e5' },
  6: { dawn: '1519681393784-d120267933ba', morning: '1470071459604-3b5ec3a7fe05', afternoon: '1472396961693-142e6e269027', sunset: '1444090542259-0af8fa96557e' },
};

const QS = 'w=1920&q=78&auto=format&fit=crop';

async function download(id, outFile) {
  const url = `https://images.unsplash.com/photo-${id}?${QS}`;
  const tmp = outFile + '.part';
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} for ${url}`);
  await pipeline(res.body, createWriteStream(tmp));
  renameSync(tmp, outFile);
}

const tasks = [];
for (const [day, slots] of Object.entries(PHOTOS)) {
  for (const [slot, id] of Object.entries(slots)) {
    const name = `${day}-${slot}.jpg`;
    const outFile = join(OUT_DIR, name);
    if (existsSync(outFile)) continue;
    tasks.push({ id, name, outFile });
  }
}

if (tasks.length === 0) {
  console.log('✓ all background photos already present');
  process.exit(0);
}

console.log(`↓ downloading ${tasks.length} background photo(s)…`);

// Parallel, but bounded.
const CONCURRENCY = 4;
let idx = 0;
let ok = 0;
let failed = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (idx < tasks.length) {
      const task = tasks[idx++];
      try {
        await download(task.id, task.outFile);
        console.log(`  ✓ ${task.name}`);
        ok++;
      } catch (err) {
        console.error(`  ✗ ${task.name}: ${err.message}`);
        failed++;
      }
    }
  })
);

console.log(`done: ${ok} ok, ${failed} failed`);
if (failed > 0) process.exit(1);
