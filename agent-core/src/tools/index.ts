import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  matchesDenylist,
  resolveLevel,
  type LevelContext,
  type PermissionLevel,
} from '../approvals.js';

export type ToolInput = Record<string, unknown>;

export interface ToolDef {
  name: string;
  /** Static tier from the settings matrix; runtime context can only harden it. */
  level: PermissionLevel;
  run(input: ToolInput): Promise<string>;
}

const LEVEL_RANK: Record<PermissionLevel, number> = { auto: 0, confirm: 1, blocked: 2 };

function strongest(a: PermissionLevel, b: PermissionLevel): PermissionLevel {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}

/**
 * Wire a static tool tier through the approval engine: denylist first, then
 * context categories; the result is never weaker than the tool's own tier.
 */
export function evaluateToolLevel(def: ToolDef, context: LevelContext): PermissionLevel {
  if (matchesDenylist(context.command ?? '')) return 'blocked';
  return strongest(def.level, resolveLevel(def.name, context));
}

const MAX_READ_BYTES = 64 * 1024;

/** Read a file, hard-limited to the current working directory. */
async function runReadFile(input: ToolInput): Promise<string> {
  const requested = typeof input.path === 'string' ? input.path : '';
  if (requested.length === 0) throw new Error('read_file requires a path');
  const root = process.cwd();
  const resolved = path.resolve(root, requested);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return `REFUSED: ${requested} resolves outside the workspace`;
  }
  const statSize = readFileSync(resolved).byteLength; // throws on missing files
  if (statSize > MAX_READ_BYTES) {
    return `REFUSED: ${requested} exceeds the ${MAX_READ_BYTES} byte skeleton cap`;
  }
  return readFileSync(resolved, 'utf8');
}

/** Three trivially safe sample tools demonstrating level wiring. */
export const TOOLS: ToolDef[] = [
  {
    name: 'echo',
    level: 'auto',
    run: async (input) => (typeof input.text === 'string' ? input.text : String(input.text ?? '')),
  },
  {
    name: 'read_file',
    level: 'confirm',
    run: runReadFile,
  },
  {
    name: 'noop',
    level: 'auto',
    run: async () => 'ok',
  },
];

export function findTool(name: string): ToolDef | undefined {
  return TOOLS.find((tool) => tool.name === name);
}