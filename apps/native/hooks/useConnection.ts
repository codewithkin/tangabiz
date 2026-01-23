import { useEffect, useState } from 'react';
import { checkHealth } from '@/lib/api';

export function useConnection(checkInterval: number = 30000) {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      const connected = await checkHealth();
      setIsConnected(connected);
      setIsLoading(false);
    };

    checkConnection();

    // Check connection at specified interval
    const interval = setInterval(checkConnection, checkInterval);
    return () => clearInterval(interval);
  }, [checkInterval]);

  return { isLoading, isConnected };
}
