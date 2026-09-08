CREATE TABLE IF NOT EXISTS progress_snapshots (
  student TEXT NOT NULL,
  namespace TEXT NOT NULL,
  state_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (student, namespace)
);

CREATE INDEX IF NOT EXISTS idx_progress_student
ON progress_snapshots (student, updated_at);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  student TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_student
ON sessions (student, expires_at);
