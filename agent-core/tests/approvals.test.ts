import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DENYLIST,
  InMemoryApprovalsStore,
  decide,
  matchesDenylist,
  resolveLevel,
  type ApprovalRequestBody,
} from '../src/approvals.js';

describe('matchesDenylist', () => {
  it('matches case-insensitively across default patterns', () => {
    expect(matchesDenylist('Format C: /FS:NTFS /Q', DEFAULT_DENYLIST)).toBe(true);
    expect(matchesDenylist('Remove-Item -Recurse -Force C:\\temp', DEFAULT_DENYLIST)).toBe(true);
    expect(matchesDenylist('git push --force origin main', DEFAULT_DENYLIST)).toBe(true);
    expect(matchesDenylist('git branch -D feature/x', DEFAULT_DENYLIST)).toBe(true);
    expect(matchesDenylist('taskkill /F /IM node.exe', DEFAULT_DENYLIST)).toBe(true);
  });

  it('does not match safe commands', () => {
    expect(matchesDenylist('git status --short', DEFAULT_DENYLIST)).toBe(false);
    expect(matchesDenylist('npm test', DEFAULT_DENYLIST)).toBe(false);
  });

  it('supports * and ? wildcards in custom patterns', () => {
    expect(matchesDenylist('taskkill /f /im worker.exe', ['taskkill */im'])).toBe(true);
    expect(matchesDenylist('reg add HKCU\\Test', ['reg a?d'])).toBe(true);
    expect(matchesDenylist('reg query HKCU\\Test', ['reg a?d'])).toBe(false);
  });
});

describe('resolveLevel precedence', () => {
  it('denylist beats every level, including would-be auto calls', () => {
    expect(resolveLevel('shell', { kind: 'shell', command: 'git reset --hard HEAD~1' })).toBe('blocked');
  });

  it('every shell command lands on confirm (FR-603)', () => {
    expect(resolveLevel('shell', { kind: 'shell', command: 'npm run build' })).toBe('confirm');
  });

  it('file writes outside the workspace confirm; inside stays auto', () => {
    const ctx = (targetPath: string) => ({
      kind: 'file_write' as const,
      targetPath,
      workspaceRoot: 'C:\\proj',
    });
    expect(resolveLevel('write_file', ctx('C:\\other\\leak.txt'))).toBe('confirm');
    expect(resolveLevel('write_file', ctx('C:\\proj\\src\\ok.txt'))).toBe('auto');
  });

  it('destructive git confirms even when not denylisted', () => {
    expect(resolveLevel('git', { kind: 'git', command: 'git reset HEAD~1' })).toBe('confirm');
    expect(resolveLevel('git', { kind: 'git', command: 'git commit -m x' })).toBe('auto');
  });

  it('network to non-provider hosts confirms; provider hosts stay auto', () => {
    expect(resolveLevel('web_fetch', { kind: 'network', host: 'evil.example.com' })).toBe('confirm');
    expect(resolveLevel('web_fetch', { kind: 'network', host: 'api.openai.com' })).toBe('auto');
  });
});

function baseRequest(overrides: Partial<ApprovalRequestBody> = {}): ApprovalRequestBody {
  return {
    id: 'apr_1',
    sessionId: 's_1',
    agentId: 'a_1',
    action: 'shell.exec',
    target: 'npm test',
    riskNote: 'runs project tests',
    level: 'confirm',
    ...overrides,
  };
}

describe('decide', () => {
  it('logs an audit-shaped row with timestamp and decision', () => {
    const store = new InMemoryApprovalsStore();
    const record = decide(baseRequest(), 'approved', store);
    expect(record.decision).toBe('approved');
    expect(typeof record.decidedAt).toBe('string');
    expect(record.decidedAt.length).toBeGreaterThan(0);
    expect(record.rememberedScope).toBeNull();
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]).toBe(record);
  });

  it('never honors remember flags for destructive requests (FR-603/604)', () => {
    const store = new InMemoryApprovalsStore();
    const record = decide(
      baseRequest({ destructive: true, rememberedScope: 'project' }),
      'approved',
      store,
    );
    expect(record.destructive).toBe(true);
    expect(record.rememberedScope).toBeNull();
  });

  it('honors remember flags only for non-destructive requests', () => {
    const store = new InMemoryApprovalsStore();
    const record = decide(baseRequest({ rememberedScope: 'project' }), 'approved', store);
    expect(record.rememberedScope).toBe('project');
  });

  it('rejects attempts to approve blocked requests outright', () => {
    const store = new InMemoryApprovalsStore();
    expect(() =>
      decide(baseRequest({ level: 'blocked' }), 'approved', store),
    ).toThrow(/can never be approved/);
    expect(store.rows).toHaveLength(0);
  });
});