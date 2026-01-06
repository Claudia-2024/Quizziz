// Backend/utils/offlineLogger.js
/**
 * Logger pour tracker les soumissions offline et la synchronisation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, '../logs');

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const offlineLogPath = path.join(logDir, 'offline-submissions.log');
const syncLogPath = path.join(logDir, 'offline-sync.log');

/**
 * Log une soumission offline
 */
export function logOfflineSubmission(data) {
    const log = {
        timestamp: new Date().toISOString(),
        responseSheetId: data.responseSheetId,
        attemptLocalId: data.attemptLocalId,
        matricule: data.matricule,
        evaluationId: data.evaluationId,
        answerCount: data.answerCount,
        isOfflineSubmission: data.isOfflineSubmission,
        clientSubmittedAt: data.clientSubmittedAt,
        serverReceivedAt: new Date().toISOString(),
        status: data.status,
        isDuplicate: data.isDuplicate || false
    };

    const logLine = JSON.stringify(log) + '\n';
    fs.appendFileSync(offlineLogPath, logLine, 'utf8');

    console.log('[OFFLINE SUBMISSION]', {
        responseSheetId: data.responseSheetId,
        attemptLocalId: data.attemptLocalId,
        isDuplicate: data.isDuplicate || false
    });
}

/**
 * Log une synchronisation offline
 */
export function logOfflineSync(data) {
    const log = {
        timestamp: new Date().toISOString(),
        responseSheetId: data.responseSheetId,
        attemptLocalId: data.attemptLocalId,
        matricule: data.matricule,
        status: data.status,
        reason: data.reason,
        error: data.error || null,
        answersSynced: data.answersSynced || 0
    };

    const logLine = JSON.stringify(log) + '\n';
    fs.appendFileSync(syncLogPath, logLine, 'utf8');

    console.log('[OFFLINE SYNC]', {
        responseSheetId: data.responseSheetId,
        status: data.status,
        error: data.error || 'none'
    });
}

/**
 * Obtenir les statistiques des soumissions offline
 */
export function getOfflineStats(days = 7) {
    if (!fs.existsSync(offlineLogPath)) {
        return { total: 0, duplicates: 0, byDay: {} };
    }

    const lines = fs.readFileSync(offlineLogPath, 'utf8').split('\n').filter(l => l.trim());
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const stats = {
        total: 0,
        duplicates: 0,
        byDay: {}
    };

    lines.forEach(line => {
        try {
            const log = JSON.parse(line);
            const logDate = new Date(log.timestamp);

            if (logDate >= cutoffDate) {
                stats.total++;
                if (log.isDuplicate) {
                    stats.duplicates++;
                }

                const dayKey = logDate.toISOString().split('T')[0];
                if (!stats.byDay[dayKey]) {
                    stats.byDay[dayKey] = 0;
                }
                stats.byDay[dayKey]++;
            }
        } catch (e) {
            console.error('Error parsing log line:', e);
        }
    });

    return stats;
}

/**
 * Nettoyer les anciens logs
 */
export function cleanupOldLogs(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    [offlineLogPath, syncLogPath].forEach(filePath => {
        if (!fs.existsSync(filePath)) return;

        const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());
        const recentLines = lines.filter(line => {
            try {
                const log = JSON.parse(line);
                const logDate = new Date(log.timestamp);
                return logDate >= cutoffDate;
            } catch (e) {
                return true; // Garder les lignes qui ne sont pas du JSON
            }
        });

        fs.writeFileSync(filePath, recentLines.join('\n') + (recentLines.length > 0 ? '\n' : ''), 'utf8');
    });

    console.log(`[OFFLINE LOGGER] Cleaned up logs older than ${days} days`);
}

