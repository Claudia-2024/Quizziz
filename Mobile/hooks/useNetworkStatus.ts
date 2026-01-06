// Mobile/hooks/useNetworkStatus.ts
import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        setIsOnline(await testConnection());
      } catch (error) {
        console.error('Error checking network status:', error);
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkNetwork();

    // Check network status every 10 seconds
    const interval = setInterval(checkNetwork, 10000);

    return () => clearInterval(interval);
  }, []);

  return { isOnline, isLoading };
}

/**
 * Test network connectivity with a simple fetch
 */
async function testConnection(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.status === 204 || response.ok;
  } catch (error) {
    return false;
  }
}

