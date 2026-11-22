// Solstice Court — make.fun entry runner (Node 22, standard library only).
// Copies static game/ files and browser screenshots/ to /output (or MAKEFUN_OUTPUT_DIR)
// and generates /output/dossier.json using the competition's vendored buildDossier helper.

import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function ensureWorldReadable(targetPath: string): void {
  const stats = statSync(targetPath);
  if (stats.isDirectory()) {
    chmodSync(targetPath, 0o755);
    for (const entry of readdirSync(targetPath)) {
      ensureWorldReadable(join(targetPath, entry));
    }
  } else if (stats.isFile()) {
    chmodSync(targetPath, 0o644);
  }
}

mkdirSync(outputDir, { recursive: true, mode: 0o755 });
cpSync(join(rootDir, 'game'), join(outputDir, 'game'), { recursive: true });

const shotsTarget = join(outputDir, 'screenshots');
mkdirSync(shotsTarget, { recursive: true, mode: 0o755 });
const shotsSource = join(rootDir, 'screenshots');
if (existsSync(shotsSource)) {
  cpSync(shotsSource, shotsTarget, { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier, { mode: 0o644 });
ensureWorldReadable(outputDir);
