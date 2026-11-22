// Lantern Heist — hand-in program for the make.fun stealth bounty.
//
// The playable game lives in game/ as plain static files. This program
// copies game/ and screenshots/ into the output directory and writes
// dossier.json there using the vendored make.fun library, so the grader
// receives exactly the bytes the library describes.
//
// Local run:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Caps mirror the gate for this bounty: dossier text capped at 160 KiB,
// at most four screenshots of at most 256 KiB each, and the game tree
// limited to 993 entries, 48 MiB in total, and 1,000-byte paths. Passing
// them here means a local run refuses exactly what the gate would refuse,
// instead of producing a dossier the gate would rebuild differently.
const dossierBytes = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
