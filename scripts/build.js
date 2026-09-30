import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const clientDir = path.join(ROOT_DIR, 'client');
const clientDistDir = path.join(clientDir, 'dist');
const publicDir = path.join(ROOT_DIR, 'public');

console.log('[Build] Starting unified production build for Vercel...');

// 1. Build Vite frontend inside client/ if client directory exists
if (fs.existsSync(clientDir)) {
  try {
    console.log('[Build] Installing client dependencies and compiling Vite frontend...');
    execSync('npm --prefix client install --include=dev', { stdio: 'inherit' });
    execSync('npm --prefix client run build', { stdio: 'inherit' });
    console.log('[Build] Vite frontend built successfully into client/dist.');
  } catch (err) {
    console.warn('[Build Warning] Vite build error, continuing with fallback:', err.message);
  }
}

// 2. Ensure public folder exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
} else {
  // Clean old assets directory to remove stale hashed chunks
  const publicAssetsDir = path.join(publicDir, 'assets');
  if (fs.existsSync(publicAssetsDir)) {
    fs.rmSync(publicAssetsDir, { recursive: true, force: true });
  }
}

// 3. Copy client/dist assets into public/ so root static hosting has everything
if (fs.existsSync(clientDistDir)) {
  try {
    fs.cpSync(clientDistDir, publicDir, { recursive: true });
    console.log(`[Build] Successfully copied assets from ${clientDistDir} to ${publicDir}`);
  } catch (err) {
    console.warn('[Build Warning] Failed copying dist directory:', err.message);
  }
}

console.log('[Build] Build complete.');
