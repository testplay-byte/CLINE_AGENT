-- ACUTE-CODE sidecar schema, version 1 (ARCHITECTURE.md section 8).
-- Applied verbatim by migrate.ts via db.exec(); every statement is idempotent
-- so ensureSchema() is safe to run on every boot.

CREATE TABLE IF NOT EXISTS projects (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  path       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,
  system_prompt TEXT NOT NULL DEFAULT '',
  provider      TEXT NOT NULL,
  model         TEXT NOT NULL,
  allowed_tools   TEXT NOT NULL DEFAULT '[]',
  memory_policy   TEXT NOT NULL DEFAULT '{}',
  max_turns       INTEGER NOT NULL DEFAULT 12,
  temperature     REAL    NOT NULL DEFAULT 0.7,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_versions (
  agent_id   TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version    INTEGER NOT NULL,
  definition TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (agent_id, version)
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title      TEXT NOT NULL,
  state      TEXT NOT NULL DEFAULT 'idle',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id         TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  agent_id   TEXT,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  seq        INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id                TEXT PRIMARY KEY,
  session_id        TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  state             TEXT NOT NULL DEFAULT 'todo',
  assignee_agent_id TEXT,
  created_at        TEXT NOT NULL
);

-- Append-only audit log backing the ONLY safety layer (ARCHITECTURE.md section 10).
CREATE TABLE IF NOT EXISTS approvals (
  id               TEXT PRIMARY KEY,
  session_id       TEXT NOT NULL,
  agent_id         TEXT,
  action           TEXT NOT NULL,
  target           TEXT NOT NULL,
  risk_note        TEXT,
  level            TEXT NOT NULL,
  decision         TEXT NOT NULL,
  decided_at       TEXT NOT NULL,
  remembered_scope TEXT
);

CREATE TABLE IF NOT EXISTS usage_records (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL,
  agent_id      TEXT,
  provider      TEXT NOT NULL,
  model         TEXT NOT NULL,
  input_tokens  INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_estimate REAL    NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 1,
  date          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memories (
  id              TEXT PRIMARY KEY,
  agent_id        TEXT NOT NULL,
  note_path       TEXT NOT NULL,
  content_summary TEXT NOT NULL DEFAULT '',
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  path            TEXT NOT NULL,
  assigned_agents TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- LangGraph-pattern checkpoint pair (bespoke; LangGraph is not a dependency).
CREATE TABLE IF NOT EXISTS run_checkpoints (
  session_id TEXT NOT NULL,
  thread_id  TEXT NOT NULL,
  seq        INTEGER NOT NULL,
  snapshot   BLOB NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (thread_id, seq)
);

CREATE TABLE IF NOT EXISTS pending_writes (
  thread_id TEXT NOT NULL,
  seq       INTEGER NOT NULL,
  data      TEXT NOT NULL,
  PRIMARY KEY (thread_id, seq)
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version    INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, seq);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
