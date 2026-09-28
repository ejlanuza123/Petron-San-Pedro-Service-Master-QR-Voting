import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const clientDistHtml = path.join(ROOT_DIR, 'client/dist/index.html');
const publicDir = path.join(ROOT_DIR, 'public');
const publicHtml = path.join(publicDir, 'index.html');

console.log('[Build] Preparing production static assets for Vercel...');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

if (fs.existsSync(clientDistHtml)) {
  fs.copyFileSync(clientDistHtml, publicHtml);
  console.log(`[Build] Successfully copied ${clientDistHtml} -> ${publicHtml}`);
} else {
  console.warn(`[Build Warning] Source file not found: ${clientDistHtml}`);
}

console.log('[Build] Build complete.');
