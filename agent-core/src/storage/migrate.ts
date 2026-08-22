import { existsSync, readFileSync } from 'node:fs';
import type Database from 'better-sqlite3';

export const SCHEMA_VERSION = 1;

/**
 * Locate schema.sql across execution modes:
 *  - tsx / vitest / tsc --noEmit run from src/storage -> same directory.
 *  - compiled dist/src/storage (tsc does not copy .sql assets) -> fall back
 *    to the source tree, which ships with the repository.
 */
function loadSchemaSql(): string {
  const candidates = [
    new URL('./schema.sql', import.meta.url),
    new URL('../../../src/storage/schema.sql', import.meta.url),
  ];
  for (const url of candidates) {
    if (existsSync(url)) return readFileSync(url, 'utf8');
  }
  throw new Error(
    `schema.sql not found next to ${import.meta.url} nor in the agent-core source tree; ` +
      'refusing to boot with an unmigrated database',
  );
}

/** Apply the full idempotent schema, then record migration version 1. */
export function ensureSchema(db: Database.Database): void {
  db.exec(loadSchemaSql());
  db.prepare(
    'INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)',
  ).run(SCHEMA_VERSION, new Date().toISOString());
}