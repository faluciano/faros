import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

type ApiFunction<T> = (token: string, ...args: any[]) => Promise<T>;

interface UseApiResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  request: (...args: any[]) => Promise<void>;
}

export const useApi = <T>(apiFunc: ApiFunction<T>): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const request = useCallback(async (...args: any[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("User is not authenticated.");
      }
      const result = await apiFunc(token, ...args);
      setData(result);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [apiFunc, getToken]);

  return { data, error, isLoading, request };
};