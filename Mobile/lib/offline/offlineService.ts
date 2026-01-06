// Mobile/lib/offline/offlineService.ts
import { openDB, nowISO } from './db';

export interface OfflineEvaluation {
  evaluationId: number;
  publishedDate: string;
  type: string;
  courseCode: string;
  courseName: string;
  startTime?: string;
  endTime?: string;
  status: string; // 'available', 'in-progress', 'submitted'
  receivedAt: string;
  questions?: OfflineQuestion[];
}

export interface OfflineQuestion {
  evaluationId: number;
  questionId: number;
  text: string;
  type: string;
  points: number;
  choices?: OfflineChoice[];
}

export interface OfflineChoice {
  evaluationId: number;
  questionId: number;
  choiceId: number;
  text: string;
  ord: number;
}

export interface OfflineAttempt {
  attemptLocalId: string;
  evaluationId: number;
  matricule: string;
  clientStartTime: string;
  serverResponseSheetId?: number;
  status: 'draft' | 'submitted' | 'synced'; // draft=not sent, submitted=sent but pending sync, synced=uploaded
  createdAt: string;
  updatedAt: string;
}

export interface OfflineAnswer {
  attemptLocalId: string;
  questionId: number;
  type: string;
  selectedOption?: number;
  textAnswer?: string;
  updatedAt: string;
}

/**
 * Save a batch of evaluations to the offline database
 */
export async function saveEvaluationsOffline(evaluations: any[]) {
  const db = openDB();

  try {
    db.execSync?.(`BEGIN TRANSACTION`);

    for (const evaluation of evaluations) {
      // Insert or update evaluation
      db.runSync?.(
        `INSERT OR REPLACE INTO evaluations 
         (evaluationId, publishedDate, type, courseCode, courseName, startTime, endTime, status, receivedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          evaluation.id || evaluation.evaluationId,
          evaluation.publishedDate,
          evaluation.type,
          evaluation.courseCode,
          evaluation.courseName,
          evaluation.startTime,
          evaluation.endTime,
          evaluation.status || 'available',
          nowISO(),
        ]
      );

      // Insert questions and choices
      const questions = Array.isArray(evaluation.questions) ? evaluation.questions : [];
      for (const q of questions) {
        db.runSync?.(
          `INSERT OR REPLACE INTO questions
           (evaluationId, questionId, text, type, points)
           VALUES (?, ?, ?, ?, ?)`,
          [evaluation.id || evaluation.evaluationId, q.questionId, q.text, q.type || 'mcq', q.points || 1]
        );

        const choices = Array.isArray(q.choices) ? q.choices : [];
        for (const c of choices) {
          db.runSync?.(
            `INSERT OR REPLACE INTO choices
             (evaluationId, questionId, choiceId, text, ord)
             VALUES (?, ?, ?, ?, ?)`,
            [evaluation.id || evaluation.evaluationId, q.questionId, c.choiceId, c.text, c.order || 0]
          );
        }
      }
    }

    db.execSync?.(`COMMIT`);
  } catch (error) {
    db.execSync?.(`ROLLBACK`);
    throw error;
  }
}

/**
 * Get all available evaluations from offline storage
 */
export async function getOfflineEvaluations(): Promise<OfflineEvaluation[]> {
  const db = openDB();

  try {
    const result: any[] = db.getAllSync?.(
      `SELECT * FROM evaluations WHERE status = 'available' ORDER BY publishedDate DESC`
    ) || [];

    // Load questions for each evaluation
    const evaluations: OfflineEvaluation[] = result.map((e) => {
      const questions = db.getAllSync?.(
        `SELECT * FROM questions WHERE evaluationId = ?`,
        [e.evaluationId]
      ) || [];

      const enrichedQuestions = questions.map((q: any) => {
        const choices = db.getAllSync?.(
          `SELECT * FROM choices WHERE evaluationId = ? AND questionId = ? ORDER BY ord`,
          [e.evaluationId, q.questionId]
        ) || [];

        return {
          ...q,
          choices,
        };
      });

      return {
        ...e,
        questions: enrichedQuestions,
      };
    });

    return evaluations;
  } catch (error) {
    console.error('Error fetching offline evaluations:', error);
    return [];
  }
}

/**
 * Get a specific evaluation from offline storage
 */
export async function getOfflineEvaluation(evaluationId: number): Promise<OfflineEvaluation | null> {
  const db = openDB();

  try {
    const result: any = db.getFirstSync?.(
      `SELECT * FROM evaluations WHERE evaluationId = ?`,
      [evaluationId]
    );

    if (!result) return null;

    const questions = db.getAllSync?.(
      `SELECT * FROM questions WHERE evaluationId = ?`,
      [evaluationId]
    ) || [];

    const enrichedQuestions = questions.map((q: any) => {
      const choices = db.getAllSync?.(
        `SELECT * FROM choices WHERE evaluationId = ? AND questionId = ? ORDER BY ord`,
        [evaluationId, q.questionId]
      ) || [];

      return { ...q, choices };
    });

    return { ...result, questions: enrichedQuestions };
  } catch (error) {
    console.error('Error fetching offline evaluation:', error);
    return null;
  }
}

/**
 * Create a new attempt (test session) for an evaluation
 */
export async function createOfflineAttempt(
  evaluationId: number,
  matricule: string
): Promise<OfflineAttempt> {
  const db = openDB();
  const attemptLocalId = `attempt_${matricule}_${evaluationId}_${Date.now()}`;
  const now = nowISO();

  try {
    db.runSync?.(
      `INSERT INTO attempts
       (attemptLocalId, evaluationId, matricule, clientStartTime, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [attemptLocalId, evaluationId, matricule, now, 'draft', now, now]
    );

    return {
      attemptLocalId,
      evaluationId,
      matricule,
      clientStartTime: now,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error('Error creating offline attempt:', error);
    throw error;
  }
}

/**
 * Save an answer for a question in an attempt
 */
export async function saveOfflineAnswer(
  attemptLocalId: string,
  questionId: number,
  answer: Partial<OfflineAnswer>
): Promise<void> {
  const db = openDB();
  const now = nowISO();

  try {
    db.runSync?.(
      `INSERT OR REPLACE INTO answers
       (attemptLocalId, questionId, type, selectedOption, textAnswer, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        attemptLocalId,
        questionId,
        answer.type || 'mcq',
        answer.selectedOption,
        answer.textAnswer,
        now,
      ]
    );

    // Update attempt's updatedAt timestamp
    db.runSync?.(
      `UPDATE attempts SET updatedAt = ? WHERE attemptLocalId = ?`,
      [now, attemptLocalId]
    );
  } catch (error) {
    console.error('Error saving offline answer:', error);
    throw error;
  }
}

/**
 * Get all answers for an attempt
 */
export async function getOfflineAnswers(attemptLocalId: string): Promise<OfflineAnswer[]> {
  const db = openDB();

  try {
    return db.getAllSync?.(
      `SELECT * FROM answers WHERE attemptLocalId = ?`,
      [attemptLocalId]
    ) || [];
  } catch (error) {
    console.error('Error fetching offline answers:', error);
    return [];
  }
}

/**
 * Get a specific attempt
 */
export async function getOfflineAttempt(attemptLocalId: string): Promise<OfflineAttempt | null> {
  const db = openDB();

  try {
    return db.getFirstSync?.(
      `SELECT * FROM attempts WHERE attemptLocalId = ?`,
      [attemptLocalId]
    ) || null;
  } catch (error) {
    console.error('Error fetching offline attempt:', error);
    return null;
  }
}

/**
 * Get all attempts for an evaluation
 */
export async function getOfflineAttempts(evaluationId: number): Promise<OfflineAttempt[]> {
  const db = openDB();

  try {
    return db.getAllSync?.(
      `SELECT * FROM attempts WHERE evaluationId = ? ORDER BY createdAt DESC`,
      [evaluationId]
    ) || [];
  } catch (error) {
    console.error('Error fetching offline attempts:', error);
    return [];
  }
}

/**
 * Mark an attempt as submitted (ready to sync when online)
 */
export async function markOfflineAttemptSubmitted(attemptLocalId: string): Promise<void> {
  const db = openDB();
  const now = nowISO();

  try {
    db.runSync?.(
      `UPDATE attempts SET status = ?, updatedAt = ? WHERE attemptLocalId = ?`,
      ['submitted', now, attemptLocalId]
    );
  } catch (error) {
    console.error('Error marking attempt as submitted:', error);
    throw error;
  }
}

/**
 * Mark an attempt as synced (successfully uploaded to server)
 */
export async function markOfflineAttemptSynced(
  attemptLocalId: string,
  serverResponseSheetId?: number
): Promise<void> {
  const db = openDB();
  const now = nowISO();

  try {
    db.runSync?.(
      `UPDATE attempts SET status = ?, serverResponseSheetId = ?, updatedAt = ? WHERE attemptLocalId = ?`,
      ['synced', serverResponseSheetId, now, attemptLocalId]
    );
  } catch (error) {
    console.error('Error marking attempt as synced:', error);
    throw error;
  }
}

/**
 * Get all pending attempts (submitted but not synced)
 */
export async function getPendingOfflineAttempts(): Promise<OfflineAttempt[]> {
  const db = openDB();

  try {
    return db.getAllSync?.(
      `SELECT * FROM attempts WHERE status IN ('draft', 'submitted') ORDER BY updatedAt ASC`
    ) || [];
  } catch (error) {
    console.error('Error fetching pending offline attempts:', error);
    return [];
  }
}

/**
 * Clear offline storage (for testing/debugging)
 */
export async function clearOfflineData(): Promise<void> {
  const db = openDB();

  try {
    db.execSync?.(`
      DELETE FROM answers;
      DELETE FROM attempts;
      DELETE FROM choices;
      DELETE FROM questions;
      DELETE FROM evaluations;
    `);
  } catch (error) {
    console.error('Error clearing offline data:', error);
    throw error;
  }
}

