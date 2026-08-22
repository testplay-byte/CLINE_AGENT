import type { MessageRole } from '@acute/shared';

export interface DemoFileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: DemoFileNode[];
  lang?: string;
  content?: string;
}

export const DEMO_PROJECT_NAME = 'acute-demo';

export const DEMO_TREE: DemoFileNode[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'src-main',
        name: 'main.tsx',
        type: 'file',
        lang: 'tsx',
        content: [
          'import { createRoot } from "react-dom/client";',
          'import App from "./App";',
          '',
          'const el = document.getElementById("root");',
          'if (!el) throw new Error("missing #root");',
          '',
          'createRoot(el).render(<App />);',
        ].join('\n'),
      },
      {
        id: 'src-app',
        name: 'App.tsx',
        type: 'file',
        lang: 'tsx',
        content: [
          'export default function App() {',
          '  return (',
          '    <main className="flex h-full">',
          '      <h1>acute-demo</h1>',
          '    </main>',
          '  );',
          '}',
        ].join('\n'),
      },
      {
        id: 'src-components',
        name: 'components',
        type: 'folder',
        children: [
          {
            id: 'src-components-button',
            name: 'Button.tsx',
            type: 'file',
            lang: 'tsx',
            content: [
              'export function Button(props: { label: string }) {',
              '  return <button>{props.label}</button>;',
              '}',
            ].join('\n'),
          },
        ],
      },
    ],
  },
  {
    id: 'pkg',
    name: 'package.json',
    type: 'file',
    lang: 'json',
    content: ['{', '  "name": "acute-demo",', '  "private": true', '}'].join('\n'),
  },
  {
    id: 'readme',
    name: 'README.md',
    type: 'file',
    lang: 'md',
    content: ['# acute-demo', '', 'Static demo tree for the ACUTE-CODE workspace shell.'].join('\n'),
  },
];

export interface DemoAction {
  icon: 'file' | 'search' | 'edit' | 'terminal';
  label: string;
  detail: string;
  status: 'ok' | 'running' | 'pending';
}

export interface DemoMessage {
  id: string;
  role: MessageRole;
  agent?: string;
  content?: string;
  actions?: DemoAction[];
  diff?: {
    fileName: string;
    additions: number;
    deletions: number;
    status: 'applied' | 'pending';
    lines: Array<{ kind: 'add' | 'del' | 'ctx'; text: string }>;
  };
}

export const DEMO_AGENT_NAME = 'Nova';
export const DEMO_AGENT_MODEL = 'claude-4-sonnet';

export const DEMO_CONVERSATION: DemoMessage[] = [
  {
    id: 'm1',
    role: 'user',
    content: 'The login route is dropping requests under burst traffic. Can you add rate limiting?',
  },
  {
    id: 'm2',
    role: 'thought',
    agent: DEMO_AGENT_NAME,
    content:
      'Burst drops usually mean an in-memory counter resetting per instance. A sliding window keyed by IP with a short TTL should smooth the edge without adding a dependency. Check the middleware chain first, then patch the limiter.',
  },
  {
    id: 'm3',
    role: 'actions',
    agent: DEMO_AGENT_NAME,
    actions: [
      { icon: 'search', label: 'grep rate', detail: '0.4s', status: 'ok' },
      { icon: 'file', label: 'src/middleware/limit.ts', detail: '1.2s', status: 'ok' },
      { icon: 'terminal', label: 'pnpm test', detail: '3.8s', status: 'ok' },
    ],
  },
  {
    id: 'm4',
    role: 'ai',
    agent: DEMO_AGENT_NAME,
    content:
      'Found it — the counter resets every request spike. I patched the middleware to use a **sliding window** keyed by `req.ip`, with `remaining` and `retryAfter` surfaced in the 429 body.',
  },
  {
    id: 'm5',
    role: 'diff',
    agent: DEMO_AGENT_NAME,
    diff: {
      fileName: 'src/middleware/limit.ts',
      additions: 6,
      deletions: 2,
      status: 'pending',
      lines: [
        { kind: 'add', text: '+ const limiter = new RateLimiter(options)' },
        { kind: 'add', text: "+ const key = options.keyGenerator?.(req) ?? req.ip" },
        { kind: 'ctx', text: '  return async (req, res, next) => {' },
        { kind: 'add', text: '+   const { remaining, resetTime } = await limiter.check(key)' },
        { kind: 'del', text: '-   if (requests > MAX_REQUESTS) {' },
        { kind: 'add', text: '+   if (remaining <= 0) {' },
        { kind: 'ctx', text: '      return res.status(429).json({' },
      ],
    },
  },
  {
    id: 'm6',
    role: 'ai',
    agent: DEMO_AGENT_NAME,
    content: 'Want me to apply the diff and re-run the integration suite?',
  },
];

export interface DemoUsagePoint {
  label: string;
  value: number;
}

const DEMO_DAYS = ['Aug 9', 'Aug 10', 'Aug 11', 'Aug 12', 'Aug 13', 'Aug 14', 'Aug 15', 'Aug 16', 'Aug 17', 'Aug 18', 'Aug 19', 'Aug 20', 'Aug 21', 'Aug 22'];

export const DEMO_USAGE_14D: DemoUsagePoint[] = DEMO_DAYS.map((label, i) => ({
  label,
  value: [12_400, 38_200, 9_800, 51_600, 44_100, 0, 0, 27_300, 61_900, 33_400, 18_700, 58_200, 47_500, 21_900][i] ?? 0,
}));

export interface DemoUsageRow {
  agent: string;
  model: string;
  tokens: number;
  requests: number;
  cost: number;
}

export const DEMO_USAGE_ROWS: DemoUsageRow[] = [
  { agent: 'Nova', model: 'claude-4-sonnet', tokens: 184_300, requests: 96, cost: 2.41 },
  { agent: 'Scout', model: 'gpt-4o-mini', tokens: 61_750, requests: 41, cost: 0.38 },
  { agent: 'Forge', model: 'claude-4-sonnet', tokens: 122_900, requests: 58, cost: 1.67 },
];

export interface DemoSessionCost {
  id: string;
  title: string;
  agent: string;
  tokens: number;
  cost: number;
  when: string;
}

export const DEMO_SESSION_COSTS: DemoSessionCost[] = [
  { id: 's1', title: 'Rate-limit the login route', agent: 'Nova', tokens: 84_200, cost: 1.12, when: 'today 14:02' },
  { id: 's2', title: 'Migrate auth to sessions table', agent: 'Forge', tokens: 122_900, cost: 1.67, when: 'yesterday' },
  { id: 's3', title: 'Research SQLite WAL tuning', agent: 'Scout', tokens: 61_750, cost: 0.38, when: 'yesterday' },
];

