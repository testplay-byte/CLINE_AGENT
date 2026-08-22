import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  name: string;
  type: string;
};

describe('@acute/agent-core scaffold', () => {
  it('resolves its workspace package manifest', () => {
    expect(manifest.name).toBe('@acute/agent-core');
    expect(manifest.type).toBe('module');
  });
});