import path from 'node:path';

/**
 * ACUTE-CODE approval engine — THE ONLY SAFETY LAYER in v1.
 * Hard rules (ARCHITECTURE.md section 10, AGENTS.md rule 9):
 *   - The denylist wins over permission levels, remembered grants, agents.
 *   - Destructive categories NEVER get an always-allow option.
 *   - No code path may bypass, weaken, or auto-confirm a gate.
 * All decision logic is exported as pure functions for unit testing.
 */

export type PermissionLevel = 'auto' | 'confirm' | 'blocked';
export type Decision = 'approved' | 'rejected';
export type RememberScope = 'project' | 'session';

/**
 * Default denylist patterns. Matching is case-insensitive substring with
 * `*` / `?` wildcards, so entries are written lowercase.
 *
 * [ASSUMPTION] "del format" from the dispatch brief is interpreted as the
 * dangerous `del` flag combinations (/f /s /q); bare `del` stays confirm-tier
 * via the shell category rather than hard-blocked.
 *
 * `curl -X POST` to non-provider hosts is intentionally NOT a static pattern:
 * provider hosts are runtime configuration, handled by the network category
 * inside resolveLevel().
 */
export const DEFAULT_DENYLIST: readonly string[] = [
  'format c:',
  'del /f',
  'del /s',
  'del /q',
  'rd /s',
  'rmdir /s',
  'remove-item -recurse -force',
  'reg add',
  'reg delete',
  'diskpart',
  'shutdown',
  'taskkill /f /im',
  'git push --force',
  'git reset --hard',
  'git branch -d',
];

/** Tools hard-blocked regardless of context; settings matrix extends this. */
export const BLOCKED_TOOLS: ReadonlySet<string> = new Set<string>([]);

/** Hosts LLM egress may talk to without confirmation (ADR-0003). */
export const PROVIDER_HOSTS: readonly string[] = [
  'api.anthropic.com',
  'api.openai.com',
  'generativelanguage.googleapis.com',
  'openrouter.ai',
];

/** Git invocations that rewrite or discard history -> always confirm tier. */
const DESTRUCTIVE_GIT: readonly string[] = [
  'git reset',
  'git clean',
  'git checkout -- ',
  'git restore',
];

export interface LevelContext {
  kind?: 'shell' | 'file_write' | 'git' | 'network' | 'other';
  /** Shell/git command line being evaluated for denylist + git checks. */
  command?: string;
  workspaceRoot?: string;
  targetPath?: string;
  host?: string;
  providerHosts?: readonly string[];
}

function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .trim()
    .toLowerCase()
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(escaped, 'i');
}

/** Case-insensitive substring/wildcard match of command against patterns. */
export function matchesDenylist(
  command: string,
  patterns: readonly string[] = DEFAULT_DENYLIST,
): boolean {
  if (command.length === 0) return false;
  return patterns.some((p) => p.length > 0 && wildcardToRegExp(p).test(command));
}

function isInsideWorkspace(targetPath: string, workspaceRoot: string): boolean {
  const rel = path.relative(path.resolve(workspaceRoot), path.resolve(targetPath));
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function isProviderHost(host: string | undefined, extra?: readonly string[]): boolean {
  if (!host) return false;
  const normalized = host.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return [...PROVIDER_HOSTS, ...(extra ?? [])].some((h) => normalized === h || normalized.endsWith(`.${h}`));
}

/**
 * Resolve permission level with strict precedence:
 *   explicit tool block > denylist rejection > confirm categories > auto.
 * Confirm categories: every shell command; file writes outside the workspace;
 * destructive git; non-LLM network calls.
 */
export function resolveLevel(tool: string, context: LevelContext = {}): PermissionLevel {
  // 1. Explicit per-tool blocks from the settings matrix.
  if (BLOCKED_TOOLS.has(tool)) return 'blocked';

  // 2. Denylist evaluated before any other check and unconditionally final.
  const command = context.command ?? '';
  if (matchesDenylist(command)) return 'blocked';

  // 3. Confirm categories (FR-603).
  switch (context.kind) {
    case 'shell':
      return 'confirm'; // every shell command confirms
    case 'file_write':
      if (
        context.targetPath !== undefined &&
        context.workspaceRoot !== undefined &&
        !isInsideWorkspace(context.targetPath, context.workspaceRoot)
      ) {
        return 'confirm';
      }
      break;
    case 'git':
      if (DESTRUCTIVE_GIT.some((p) => command.toLowerCase().includes(p))) return 'confirm';
      break;
    case 'network':
      if (!isProviderHost(context.host, context.providerHosts)) return 'confirm';
      break;
    case 'other':
    default:
      break;
  }

  // 4. Everything else runs without interruption.
  return 'auto';
}

export interface ApprovalRequestBody {
  id: string;
  sessionId: string;
  agentId: string;
  action: string;
  target: string;
  riskNote: string;
  level: PermissionLevel;
  /** True when the request falls into a destructive FR-603 category. */
  destructive?: boolean;
  /** Scope the user asked to remember; ignored (stripped) when destructive. */
  rememberedScope?: RememberScope | null;
}

export interface ApprovalRecord extends ApprovalRequestBody {
  destructive: boolean;
  decision: Decision;
  decidedAt: string;
  rememberedScope: RememberScope | null;
}

export interface ApprovalsStore {
  insertApproval(record: ApprovalRecord): void;
}

/** Minimal append-only store for tests and pre-DB wiring. */
export class InMemoryApprovalsStore implements ApprovalsStore {
  readonly rows: ApprovalRecord[] = [];
  insertApproval(record: ApprovalRecord): void {
    this.rows.push(record);
  }
}

/**
 * Validate a user decision and append it to the audit log.
 * Throws on attempts to approve blocked requests; silently strips the
 * remember flag for destructive requests (it can NEVER be auto-approved).
 */
export function decide(
  request: ApprovalRequestBody,
  userDecision: Decision,
  store: ApprovalsStore,
): ApprovalRecord {
  if (request.level === 'blocked' && userDecision === 'approved') {
    throw new Error(`approval ${request.id}: blocked requests can never be approved`);
  }
  const destructive = request.destructive ?? false;
  const record: ApprovalRecord = {
    ...request,
    destructive,
    decision: userDecision,
    decidedAt: new Date().toISOString(),
    // FR-604: remember-per-project only exists for non-destructive categories.
    rememberedScope: destructive ? null : (request.rememberedScope ?? null),
  };
  store.insertApproval(record);
  return record;
}