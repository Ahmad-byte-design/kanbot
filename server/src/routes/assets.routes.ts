import { existsSync, readdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import type { ProjectBackground } from '../types/api.js';

/** The folder that holds the project background images. */
export function assetsDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // `tsx` runs from src/routes; the compiled build lives in dist/routes.
  const candidates = [resolve(here, '..', 'assets'), resolve(here, '..', '..', 'src', 'assets')];
  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0]!;
}

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const BACKGROUND_FILE = /^bg-[a-z0-9-]+\.(jpe?g|png|webp|avif)$/;

function titleFor(id: string): string {
  const label = id.replace(/^bg-/, '').replace(/-/g, ' ');
  return `Background ${label}`;
}

/** Every background image shipped with the server, newest first by file name. */
export function listBackgrounds(): ProjectBackground[] {
  let files: string[] = [];
  try {
    files = readdirSync(assetsDir());
  } catch {
    return [];
  }

  return files
    .filter((file) => BACKGROUND_FILE.test(file))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => {
      const id = file.slice(0, -extname(file).length);
      return { id, url: `/api/assets/${file}`, name: titleFor(id) };
    });
}

/** Mounted at /api/assets. Public: the images are not user data. */
export const assetsRouter = Router();

assetsRouter.get('/backgrounds', (_req, res) => {
  res.json({ backgrounds: listBackgrounds() });
});

/** Only the shipped images are served, never arbitrary files. */
export function isBackgroundFile(file: string): boolean {
  return BACKGROUND_FILE.test(file) && IMAGE_EXTENSIONS.has(extname(file).toLowerCase());
}

assetsRouter.get('/:file', (req, res, next) => {
  const file = req.params.file;
  if (!isBackgroundFile(file)) {
    next();
    return;
  }
  // Images are loaded by the Vite dev server on another origin.
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  res.sendFile(file, { root: assetsDir() }, (error) => {
    if (error) next();
  });
});
