import { spawnSync } from 'node:child_process';

/**
 * Windows Credential Manager bridge (FR-1201): provider keys live only in
 * DPAPI-backed generic credentials named ACUTE-CODE.<Provider>.
 * Key material is NEVER logged; errors carry no secret content.
 *
 * Resolution order:
 *   1. env override ACUTE_API_KEY_<PROVIDER> (tests, CI)
 *   2. Credential Manager via a PowerShell CredReadW P/Invoke one-shot
 */

const CRED_TARGET_PREFIX = 'ACUTE-CODE.';

function envOverrideName(provider: string): string {
  return `ACUTE_API_KEY_${provider.toUpperCase()}`;
}

function readFromCredentialManager(target: string): string {
  // Target names are restricted to [A-Za-z0-9._-]; reject anything else so the
  // single-quote embedding below cannot be abused.
  if (!/^[A-Za-z0-9._-]+$/.test(target)) {
    throw new Error(`invalid credential target ${JSON.stringify(target.replace(/[^\w.-]/g, '?'))}`);
  }
  // Double quotes are embedded as escape sequences so this file stays ASCII-safe.
  const script = [
    '$sig = @\x27',
    'using System;',
    'using System.Runtime.InteropServices;',
    'public class AcuteCred {',
    '  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]',
    '  public struct CREDENTIAL {',
    '    public int Flags;',
    '    public int Type;',
    '    public string TargetName;',
    '    public string Comment;',
    '    public long LastWritten;',
    '    public int CredentialBlobSize;',
    '    public IntPtr CredentialBlob;',
    '    public int Persist;',
    '    public int AttributeCount;',
    '    public IntPtr Attributes;',
    '    public string TargetAlias;',
    '    public string UserName;',
    '  }',
    '  [DllImport(\x22advapi32.dll\x22, CharSet = CharSet.Unicode, SetLastError = true)]',
    '  public static extern bool CredReadW(string target, int type, int flags, out IntPtr credPtr);',
    '  [DllImport(\x22advapi32.dll\x22)]',
    '  public static extern void CredFree(IntPtr cred);',
    '}',
    '\x27@;',
    'Add-Type -TypeDefinition $sig;',
    '$p = [IntPtr]::Zero;',
    `if (-not [AcuteCred]::CredReadW('${target}', 1, 0, [ref]$p)) { exit 3 }`,
    'try {',
    '  $c = [Runtime.InteropServices.Marshal]::PtrToStructure($p, [type][AcuteCred+CREDENTIAL]);',
    '  $b = New-Object byte[] $c.CredentialBlobSize;',
    '  [Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $b, 0, $c.CredentialBlobSize);',
    '  [Console]::Out.Write([Text.Encoding]::Unicode.GetString($b));',
    '} finally { [AcuteCred]::CredFree($p) }',
  ].join('\n');
  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', script],
    { encoding: 'utf8', windowsHide: true },
  );
  if (result.status !== 0) {
    // exit 3 = CredReadW failed (missing credential); other codes = host trouble.
    throw new Error(
      result.status === 3
        ? `no Credential Manager entry for ${CRED_TARGET_PREFIX}${target}`
        : `Credential Manager unavailable (powershell exit ${String(result.status)})`,
    );
  }
  const key = result.stdout ?? '';
  if (key.length === 0) {
    throw new Error(`Credential Manager entry ${CRED_TARGET_PREFIX}${target} is empty`);
  }
  return key;
}

/** Resolve the API key for a provider without ever logging the value. */
export function getApiKey(provider: string): string {
  const override = process.env[envOverrideName(provider)];
  if (typeof override === 'string' && override.length > 0) return override;
  return readFromCredentialManager(`${CRED_TARGET_PREFIX}${provider}`);
}