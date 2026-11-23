// main.ts — MARAVILLA entrypoint (Node 22, standard library only).
// Hands the game in: copies game/ and screenshots/ beside this file into the
// output directory and writes /output/dossier.json with the vendored
// make.fun library. The grader runs it twice; both runs write the same bytes.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// v2 — validates the screenshots before building the dossier: exactly four
// files, each a real JPEG under 256 KiB, so a broken render fails loudly
// here instead of shipping a dossier the judge cannot read.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the folder this file lives in.
const root = fileURLToPath(new URL('.', import.meta.url));
// The grader gives us a writable /output; locally we use MAKEFUN_OUTPUT_DIR.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// --- screenshot validation (v2) -------------------------------------------
// The judge sees the game through its screenshots, so they must be present,
// complete and inside the size cap. A JPEG starts with the SOI marker
// 0xFF 0xD8; a PNG starts with 0x89 'P' 'N' 'G'. Anything else is a broken
// render and the entry must fail here, not on the judge's screen.
const SHOT_MAX_BYTES = 262144;
const SHOT_COUNT = 4;

function validateScreenshots(dir) {
  if (!existsSync(dir)) throw new Error('screenshots/ is missing');
  const files = readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
  if (files.length !== SHOT_COUNT) {
    throw new Error(`expected ${SHOT_COUNT} screenshots, found ${files.length}`);
  }
  for (const f of files) {
    const p = join(dir, f);
    const size = statSync(p).size;
    if (size > SHOT_MAX_BYTES) {
      throw new Error(`${f} is ${size} bytes, over the ${SHOT_MAX_BYTES} cap`);
    }
    const head = readFileSync(p, { start: 0, end: 4 });
    const isJpeg = head[0] === 0xff && head[1] === 0xd8;
    const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
    if (!isJpeg && !isPng) throw new Error(`${f} is not a JPEG or PNG image`);
  }
  return files;
}

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

// The game must have its entry page, and the screenshots must be valid,
// before anything is copied — fail fast on a broken build.
if (!existsSync(join(root, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing');
}
const shots = validateScreenshots(join(root, 'screenshots'));

// The whole game (static files, no build step) and the screenshots go over.
copyTree(join(root, 'game'), join(outDir, 'game'));
copyTree(join(root, 'screenshots'), join(outDir, 'screenshots'));

// The dossier is what the judge reads: the game's source, vendored files and
// assets, plus the screenshots. The caps below are the scorer's own limits —
// the dossier is at most 1.5 MiB, the source text at most 160 KiB, at most
// four screenshots of at most 256 KiB each, and game/ at most 993 files and
// 48 MiB in all. buildDossier refuses anything over those caps, so a bad
// entry fails here instead of silently passing a broken dossier.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
