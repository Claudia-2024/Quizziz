// Mobile/lib/offline/db.ts
import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'quizzy_offline.db';

export async function openDB() {
  // Forces a new connection to avoid the NullPointer issue on Android
  return await SQLite.openDatabaseAsync(DB_NAME, { useNewConnection: true });
}

export async function initDB() {
  const db: any = openDB();
  // Basic schema (v1)
  db.execSync?.(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      evaluationId INTEGER PRIMARY KEY,
      publishedDate TEXT,
      type TEXT,
      courseCode TEXT,
      courseName TEXT,
      startTime TEXT,
      endTime TEXT,
      status TEXT,
      receivedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS questions (
      evaluationId INTEGER,
      questionId INTEGER,
      text TEXT,
      type TEXT,
      points REAL,
      PRIMARY KEY (evaluationId, questionId)
    );

    CREATE TABLE IF NOT EXISTS choices (
      evaluationId INTEGER,
      questionId INTEGER,
      choiceId INTEGER,
      text TEXT,
      ord INTEGER,
      PRIMARY KEY (evaluationId, questionId, choiceId)
    );

    CREATE TABLE IF NOT EXISTS attempts (
      attemptLocalId TEXT PRIMARY KEY,
      evaluationId INTEGER,
      matricule TEXT,
      clientStartTime TEXT,
      serverResponseSheetId INTEGER,
      status TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS answers (
      attemptLocalId TEXT,
      questionId INTEGER,
      type TEXT,
      selectedOption INTEGER,
      textAnswer TEXT,
      updatedAt TEXT,
      PRIMARY KEY (attemptLocalId, questionId)
    );

    CREATE INDEX IF NOT EXISTS idx_eval_status ON evaluations(status);
    CREATE INDEX IF NOT EXISTS idx_attempt_eval ON attempts(evaluationId);
  `);
}

export function nowISO() {
  return new Date().toISOString();
}
