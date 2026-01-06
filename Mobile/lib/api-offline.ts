// Mobile/lib/api-offline.ts
/**
 * API wrapper with offline support
 * Falls back to offline data when network is unavailable
 */

import { API_BASE_URL } from './config';
import { getToken } from './storage';
import {
  getOfflineEvaluations,
  getOfflineEvaluation,
  OfflineEvaluation,
} from './offline/offlineService';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
    allowOffline?: boolean;
  } = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = API_BASE_URL + path;

  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout?.(30000), // 30 second timeout
    });

    const text = await res.text();
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (err) {
        if (!res.ok) {
          throw new Error(text || res.statusText);
        }
        throw new Error('Invalid JSON response');
      }
    }
    if (!res.ok) {
      const message = (data as any)?.message || (data as any)?.error || text || res.statusText;
      throw new Error(message);
    }
    return data as T;
  } catch (networkError) {
    // If offline and method is GET and allowOffline is true, try offline data
    if (
      options.method === 'GET' &&
      options.allowOffline &&
      (networkError instanceof TypeError || networkError instanceof Error)
    ) {
      console.warn(
        `Network request failed for ${path}, attempting offline fallback`,
        networkError
      );
      return await getOfflineFallback<T>(path);
    }

    throw networkError;
  }
}

async function getOfflineFallback<T>(path: string): Promise<T> {
  // Handle specific endpoints that can use offline data
  if (path.includes('/evaluation/student/revision')) {
    const evals = await getOfflineEvaluations();
    return evals as unknown as T;
  }

  if (path.includes('/evaluation/student/')) {
    const match = path.match(/\/evaluation\/student\/([^/]+)$/);
    if (match) {
      const matricule = match[1];
      const evals = await getOfflineEvaluations();
      return evals.filter((e) => e.status === 'available') as unknown as T;
    }
  }

  throw new Error(
    `No offline data available for ${path}. This operation requires internet connection.`
  );
}

export const apiWithOffline = {
  get: <T,>(path: string, options: { allowOffline?: boolean } = {}) =>
    request<T>(path, { method: 'GET', allowOffline: options.allowOffline ?? true }),

  post: <T,>(path: string, body?: any) => request<T>(path, { method: 'POST', body }),

  put: <T,>(path: string, body?: any) => request<T>(path, { method: 'PUT', body }),

  delete: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/**
 * Direct offline data access (no network attempt)
 */
export const offlineData = {
  getEvaluations: getOfflineEvaluations,
  getEvaluation: getOfflineEvaluation,
};

