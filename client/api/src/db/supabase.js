import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env reliably without external dependencies
function loadEnv() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const candidatePaths = [
    path.resolve(currentDir, '../../.env'),
    path.resolve(process.cwd(), 'server/.env'),
    path.resolve(process.cwd(), '.env')
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf-8');
        for (const line of content.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
            if (process.env[key] === undefined) {
              process.env[key] = val;
            }
          }
        }
        break;
      } catch (err) {
        console.warn('Could not read .env:', err.message);
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
  return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) && process.env.SUPABASE_URL.startsWith('https://'));
};

/**
 * Lightweight, zero-dependency REST Client for Supabase PostgREST
 */
class SupabaseClient {
  constructor(url, key) {
    this.url = url ? url.replace(/\/$/, '') : '';
    this.key = key || '';
  }

  getHeaders() {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  async select(table, queryParams = '') {
    if (!isSupabaseConfigured()) return null;
    try {
      const res = await fetch(`${this.url}/rest/v1/${table}${queryParams ? `?${queryParams}` : ''}`, {
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error(`Supabase select error: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.error(`[Supabase Error on ${table}]:`, err.message);
      return null;
    }
  }

  async insert(table, data) {
    if (!isSupabaseConfigured()) return null;
    try {
      const res = await fetch(`${this.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`Supabase insert error: ${res.statusText}`);
      const json = await res.json();
      return Array.isArray(json) ? json[0] : json;
    } catch (err) {
      console.error(`[Supabase Insert Error on ${table}]:`, err.message);
      return null;
    }
  }

  async update(table, id, updates) {
    if (!isSupabaseConfigured()) return null;
    try {
      const res = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error(`Supabase update error: ${res.statusText}`);
      const json = await res.json();
      return Array.isArray(json) ? json[0] : json;
    } catch (err) {
      console.error(`[Supabase Update Error on ${table}]:`, err.message);
      return null;
    }
  }

  async delete(table, id) {
    if (!isSupabaseConfigured()) return false;
    try {
      const res = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return res.ok;
    } catch (err) {
      console.error(`[Supabase Delete Error on ${table}]:`, err.message);
      return false;
    }
  }
}

export const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY);
export default supabase;
