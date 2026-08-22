import { describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';

// Tests must never require a launch token.
delete process.env.ACUTE_TOKEN;

describe('sidecar server', () => {
  it('GET /health answers 200 with ok:true', async () => {
    const app = await buildServer({ dbPath: ':memory:' });
    try {
      const response = await app.inject({ method: 'GET', url: '/health' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ ok: true });
    } finally {
      await app.close();
    }
  });

  it('GET /version exposes name, version and node fields', async () => {
    const app = await buildServer({ dbPath: ':memory:' });
    try {
      const response = await app.inject({ method: 'GET', url: '/version' });
      expect(response.statusCode).toBe(200);
      const body = response.json() as Record<string, unknown>;
      expect(body.name).toBe('@acute/agent-core');
      expect(String(body.version)).toMatch(/^\d+\.\d+\.\d+/);
      expect(String(body.node)).toMatch(/^v\d+/);
    } finally {
      await app.close();
    }
  });

  it('GET /api/agents lists an empty registry without error', async () => {
    const app = await buildServer({ dbPath: ':memory:' });
    try {
      const response = await app.inject({ method: 'GET', url: '/api/agents' });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ agents: [] });
    } finally {
      await app.close();
    }
  });

  it('enforces the launch token gate when ACUTE_TOKEN is set', async () => {
    process.env.ACUTE_TOKEN = 'test-token';
    try {
      const app = await buildServer({ dbPath: ':memory:' });
      try {
        const missing = await app.inject({ method: 'GET', url: '/health' });
        expect(missing.statusCode).toBe(401);
        const wrong = await app.inject({
          method: 'GET',
          url: '/health',
          headers: { 'x-acute-token': 'wrong' },
        });
        expect(wrong.statusCode).toBe(401);
        const good = await app.inject({
          method: 'GET',
          url: '/health',
          headers: { 'x-acute-token': 'test-token' },
        });
        expect(good.statusCode).toBe(200);
      } finally {
        await app.close();
      }
    } finally {
      delete process.env.ACUTE_TOKEN;
    }
  });
});