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
  // 1. Await the database handle with the recommended safety flag
  const db = await openDB();

  try {
    // 2. Use withTransactionAsync for safe, high-performance batch inserts
    await db.withTransactionAsync(async () => {
      for (const evaluation of evaluations) {
        const evalId = evaluation.id || evaluation.evaluationId;

        // Insert or update evaluation
        await db.runAsync(
          `INSERT OR REPLACE INTO evaluations
           (evaluationId, publishedDate, type, courseCode, courseName, startTime, endTime, status, receivedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            evalId,
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

        // Insert questions
        const questions = Array.isArray(evaluation.questions) ? evaluation.questions : [];
        for (const q of questions) {
          await db.runAsync(
            `INSERT OR REPLACE INTO questions
             (evaluationId, questionId, text, type, points)
             VALUES (?, ?, ?, ?, ?)`,
            [evaluation.id || evaluation.evaluationId, q.questionId, c.choiceId, c.text, c.order || 0]
          );

          // Insert choices
          const choices = Array.isArray(q.choices) ? q.choices : [];
          for (const c of choices) {
            await db.runAsync(
              `INSERT OR REPLACE INTO choices
               (evaluationId, questionId, choiceId, text, ord)
               VALUES (?, ?, ?, ?, ?)`,
              [evalId, q.questionId, c.choiceId, c.text, c.order || 0]
            );
          }
        }
      }
    });
  } catch (error) {
    console.error("Error saving evaluations offline:", error);
    throw error;
  }
}


/**
 * Get all available evaluations from offline storage
 */
export async function getOfflineEvaluations(): Promise<OfflineEvaluation[]> {
  // Ensure we await the database handle
  const db = await openDB();

  try {
    // 1. Fetch all available evaluations
    const result: any[] = await db.getAllAsync(
      `SELECT * FROM evaluations WHERE status = 'available' ORDER BY publishedDate DESC`
    );

    // 2. Map through evaluations and fetch nested questions asynchronously
    const evaluations = await Promise.all(result.map(async (e) => {

      const questions: any[] = await db.getAllAsync(
        `SELECT * FROM questions WHERE evaluationId = ?`,
        [e.evaluationId]
      );

      // 3. Map through questions and fetch nested choices
      const enrichedQuestions = await Promise.all(questions.map(async (q) => {
        const choices = await db.getAllAsync(
          `SELECT * FROM choices WHERE evaluationId = ? AND questionId = ? ORDER BY ord`,
          [e.evaluationId, q.questionId]
        );

        return { ...q, choices };
      }));

      return {
        ...e,
        questions: enrichedQuestions,
      };
    }));

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
  // 1. Await the database handle (ensure openDB is updated to openDatabaseAsync)
  const db = await openDB();

  try {
    // 2. Fetch the single evaluation record asynchronously
    const result: any = await db.getFirstAsync(
      `SELECT * FROM evaluations WHERE evaluationId = ?`,
      [evaluationId]
    );

    if (!result) return null;

    // 3. Fetch all questions for this evaluation
    const questions: any[] = await db.getAllAsync(
      `SELECT * FROM questions WHERE evaluationId = ?`,
      [evaluationId]
    );

    // 4. Use Promise.all to fetch choices for all questions in parallel
    const enrichedQuestions = await Promise.all(
      questions.map(async (q: any) => {
        const choices = await db.getAllAsync(
          `SELECT * FROM choices WHERE evaluationId = ? AND questionId = ? ORDER BY ord`,
          [evaluationId, q.questionId]
        );

        return {
          ...q,
          choices
        };
      })
    );

    return {
      ...result,
      questions: enrichedQuestions
    };
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
  // 1. Await the database handle
  const db = await openDB();

  const attemptLocalId = `attempt_${matricule}_${evaluationId}_${Date.now()}`;
  const now = nowISO();

  try {
    // 2. Use runAsync instead of runSync
    await db.runAsync(
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
  // 1. Await the database handle
  const db = await openDB();
  const now = nowISO();

  try {
    // 2. Use withTransactionAsync to ensure both operations succeed together
    // This is more efficient and safer for dual-writes
    await db.withTransactionAsync(async () => {

      // 3. Save or update the specific answer
      await db.runAsync(
        `INSERT OR REPLACE INTO answers
         (attemptLocalId, questionId, type, selectedOption, textAnswer, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          attemptLocalId,
          questionId,
          answer.type || 'mcq',
          answer.selectedOption ?? null, // Ensure null if undefined
          answer.textAnswer ?? null,     // Ensure null if undefined
          now,
        ]
      );

      // 4. Update the parent attempt's timestamp
      await db.runAsync(
        `UPDATE attempts SET updatedAt = ? WHERE attemptLocalId = ?`,
        [now, attemptLocalId]
      );
    });
  } catch (error) {
    console.error('Error saving offline answer:', error);
    throw error;
  }
}


/**
 * Get all answers for an attempt
 */
export async function getOfflineAnswers(attemptLocalId: string): Promise<OfflineAnswer[]> {
  // 1. Await the stable database handle
  const db = await openDB();

  try {
    // 2. Use getAllAsync instead of getAllSync
    const result = await db.getAllAsync<OfflineAnswer>(
      `SELECT * FROM answers WHERE attemptLocalId = ?`,
      [attemptLocalId]
    );

    return result || [];
  } catch (error) {
    console.error('Error fetching offline answers:', error);
    return [];
  }
}


/**
 * Get a specific attempt
 */
export async function getOfflineAttempt(attemptLocalId: string): Promise<OfflineAttempt | null> {
  // 1. Await the stable database handle
  const db = await openDB();

  try {
    // 2. Use getFirstAsync instead of getFirstSync
    // In 2026, the generic <OfflineAttempt> ensures your result is properly typed
    const result = await db.getFirstAsync<OfflineAttempt>(
      `SELECT * FROM attempts WHERE attemptLocalId = ?`,
      [attemptLocalId]
    );

    return result || null;
  } catch (error) {
    console.error('Error fetching offline attempt:', error);
    return null;
  }
}

/**
 * Get all attempts for an evaluation
 */
export async function getOfflineAttempts(evaluationId: number): Promise<OfflineAttempt[]> {
  // 1. Await the stable database handle
  const db = await openDB();

  try {
    // 2. Use getAllAsync instead of getAllSync
    const result = await db.getAllAsync<OfflineAttempt>(
      `SELECT * FROM attempts WHERE evaluationId = ? ORDER BY createdAt DESC`,
      [evaluationId]
    );

    return result || [];
  } catch (error) {
    console.error('Error fetching offline attempts:', error);
    return [];
  }
}


/**
 * Mark an attempt as submitted (ready to sync when online)
 */
export async function markOfflineAttemptSubmitted(attemptLocalId: string): Promise<void> {
  // 1. Await the stable database handle
  const db = await openDB();
  const now = nowISO();

  try {
    // 2. Use runAsync instead of runSync
    await db.runAsync(
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
  // 1. Await the stable database handle
  const db = await openDB();
  const now = nowISO();

  try {
    // 2. Use runAsync instead of runSync
    await db.runAsync(
      `UPDATE attempts
       SET status = ?, serverResponseSheetId = ?, updatedAt = ?
       WHERE attemptLocalId = ?`,
      ['synced', serverResponseSheetId ?? null, now, attemptLocalId]
    );
  } catch (error) {
    console.error('Error marking attempt as synced:', error);
    throw error;
  }
}


/**
 * Get all pending attempts (submitted but not synced)
export async function getPendingOfflineAttempts(): Promise<OfflineAttempt[]> {
  // 1. Await the stable database handle
  const db = await openDB();

  try {
    // 2. Use getAllAsync instead of getAllSync
    // The generic <OfflineAttempt> ensures your result is properly typed
    const result = await db.getAllAsync<OfflineAttempt>(
      `SELECT * FROM attempts WHERE status IN ('draft', 'submitted') ORDER BY updatedAt ASC`
    );

    return result || [];
  } catch (error) {
    console.error('Error fetching pending offline attempts:', error);
    return [];
  }
}


/**
 * Clear offline storage (for testing/debugging)
 */
export async function getPendingOfflineAttempts(): Promise<OfflineAttempt[]> {
  // 1. Await the stable database handle
  const db = await openDB();

  try {
    const result = await db.getAllAsync<OfflineAttempt>(
      `SELECT * FROM attempts WHERE status IN ('draft', 'submitted') ORDER BY updatedAt ASC`
    );

    return result || [];
  } catch (error) {
    console.error('Error fetching pending offline attempts:', error);
    return [];
  }
}


