/**
 * Per-user character config storage.
 * Persists archetype + aesthetic selection per userId for multi-session support.
 */

import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import type { CharacterConfig } from './characters';

const STORE_FILE = 'snapbot-characters.json';

interface StoredCharacterData {
  config: CharacterConfig | null;
  enabled: boolean;
}

interface StoredCharacters {
  [userId: string]: StoredCharacterData;
}

let cache: StoredCharacters | null = null;

function getStorePath(): string {
  const userData = app.getPath('userData');
  return path.join(userData, STORE_FILE);
}

function load(): StoredCharacters {
  if (cache) return cache;
  try {
    const p = getStorePath();
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      cache = JSON.parse(raw) as StoredCharacters;
      return cache ?? {};
    }
  } catch {
    // ignore
  }
  cache = {};
  return cache;
}

function save(): void {
  const data = load();
  try {
    const p = getStorePath();
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Character store save failed:', e);
  }
}

function migrateEntry(raw: unknown): StoredCharacterData {
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if ('archetypeId' in o && 'aestheticId' in o) {
      return { config: o as CharacterConfig, enabled: true };
    }
    if ('config' in o || 'enabled' in o) {
      return {
        config: (o.config as CharacterConfig) ?? null,
        enabled: (o.enabled as boolean) ?? false,
      };
    }
  }
  return { config: null, enabled: false };
}

export function getCharacterData(userId: string | null): StoredCharacterData | null {
  if (!userId) return null;
  const data = load();
  const raw = data[userId];
  if (!raw) return null;
  return migrateEntry(raw);
}

export function setCharacterData(
  userId: string | null,
  data: Partial<StoredCharacterData>
): void {
  if (!userId) return;
  const all = load();
  const existing = migrateEntry(all[userId]);
  if ('config' in data) existing.config = data.config ?? null;
  if (data.enabled !== undefined) existing.enabled = data.enabled;
  all[userId] = existing;
  save();
}
