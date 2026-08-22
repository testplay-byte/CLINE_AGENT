import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import websocketPlugin, { type SocketStream } from '@fastify/websocket';
import { getDb } from './storage/db.js';

const manifest = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { name: string; version: string };

export interface WsEnvelope {
  type: string;
  sessionId: string;
  seq: number;
  payload: unknown;
}

export interface BuildServerOptions {
  logger?: boolean;
  /** SQLite file path; defaults to ACUTE_DB_PATH then ./acute.db. */
  dbPath?: string;
}

export async function buildServer(options: BuildServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });
  const db = await getDb(options.dbPath ?? process.env.ACUTE_DB_PATH ?? 'acute.db');
  app.addHook('onClose', () => db.close());

  // Launch-token gate (ARCHITECTURE.md section 4): when ACUTE_TOKEN is set,
  // every request must carry it in x-acute-token.
  const token = process.env.ACUTE_TOKEN;
  if (typeof token === 'string' && token.length > 0) {
    app.addHook('onRequest', async (request, reply) => {
      if (request.headers['x-acute-token'] !== token) {
        await reply.code(401).send({ error: 'unauthorized' });
      }
    });
  }

  app.get('/health', async () => ({ ok: true }));

  app.get('/version', async () => ({
    name: manifest.name,
    version: manifest.version,
    node: process.version,
  }));

  interface AgentRow {
    id: string;
    name: string;
    role: string;
    provider: string;
    model: string;
  }
  app.get('/api/agents', async () => {
    const rows = db
      .prepare('SELECT id, name, role, provider, model FROM agents ORDER BY created_at ASC')
      .all() as AgentRow[];
    return { agents: rows };
  });

  await app.register(websocketPlugin);

  app.get('/ws', { websocket: true }, (conn: SocketStream) => {
    // Per-connection strictly monotonic sequence cursor (section 7).
    let seq = 0;
    const send = (envelope: WsEnvelope): void => {
      try {
        conn.socket.send(JSON.stringify(envelope));
      } catch {
        // client vanished mid-send; nothing to do for a skeleton hub
      }
    };
    send({
      type: 'run.state.changed',
      sessionId: '',
      seq: seq++,
      payload: { state: 'idle' },
    });
    conn.socket.on('message', (raw: unknown) => {
      try {
        const frame = JSON.parse(String(raw)) as { type?: unknown };
        if (frame.type === 'resume') return; // no ring buffer yet; tolerate silently
      } catch {
        // malformed frame ignored
      }
    });
  });

  return app;
}

export async function main(): Promise<void> {
  const app = await buildServer();
  const port = Number(process.env.ACUTE_PORT ?? 4919);
  await app.listen({ port, host: '127.0.0.1' });
  console.log(`[agent-core] listening on http://127.0.0.1:${String(port)}`);
}

// Run only when executed directly (node dist/src/server.js / tsx src/server.ts).
const entryHref = process.argv[1] !== undefined ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === entryHref) {
  main().catch((error: unknown) => {
    console.error('[agent-core] fatal:', error);
    process.exitCode = 1;
  });
}