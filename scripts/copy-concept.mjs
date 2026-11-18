// After `vite build`: on Vercel PREVIEW builds only, copy the static design concept (concept/) into dist/concept/
// so the review link serves it at /concept/. Production builds and local builds skip this step entirely,
// so the concept can never ship to uspanels.com by accident.
// To test it locally:  COPY_CONCEPT=1 npm run build
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'concept');
const dest = path.join(root, 'dist', 'concept');

const isPreview = process.env.VERCEL_ENV === 'preview' || process.env.COPY_CONCEPT === '1';
if (!isPreview) {
  console.log(`[copy-concept] skipped (VERCEL_ENV=${process.env.VERCEL_ENV || 'unset'}); the concept is only added to preview builds`);
  process.exit(0);
}
if (!fs.existsSync(src)) {
  console.log('[copy-concept] no concept/ folder on this branch, nothing to copy');
  process.exit(0);
}
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
const count = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(path.join(d, e.name)) : 1), 0);
console.log(`[copy-concept] copied ${count(dest)} files to dist/concept (preview build)`);
