import type Database from 'better-sqlite3';
import { ensureSchema } from './migrate.js';

/**
 * Open (creating if needed) the sidecar-owned SQLite database with the
 * ARCHITECTURE.md section 8 posture: WAL journal, foreign keys enforced,
 * schema ensured before first use. The sidecar is the sole owner of this
 * file; nothing else in the product opens it.
 *
 * better-sqlite3 is a native module, so it is loaded lazily inside getDb():
 * modules that never open the database (and unit tests that never call this
 * function) never load the binding at all.
 */
export async function getDb(path: string): Promise<Database.Database> {
  const { default: Database } = await import('better-sqlite3');
  const db = new Database(path);
  // On :memory: databases SQLite keeps the default journal mode; harmless.
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  ensureSchema(db);
  return db;
}