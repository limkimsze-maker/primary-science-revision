CREATE TABLE IF NOT EXISTS progress_snapshots (
  sync_hash TEXT NOT NULL,
  student TEXT NOT NULL,
  namespace TEXT NOT NULL,
  state_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (sync_hash, student, namespace)
);

CREATE INDEX IF NOT EXISTS idx_progress_student
ON progress_snapshots (student, updated_at);
