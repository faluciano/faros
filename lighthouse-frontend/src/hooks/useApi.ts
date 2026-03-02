import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

type ApiFunction<T> = (token: string, ...args: unknown[]) => Promise<T>;

interface UseApiResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  request: (...args: unknown[]) => Promise<void>;
}

export const useApi = <T>(apiFunc: ApiFunction<T>): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const request = useCallback(async (...args: unknown[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        throw new Error("User is not authenticated.");
      }
      const result = await apiFunc(token, ...args);
      setData(result);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error(String(err)));
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiFunc, getToken]);

  return { data, error, isLoading, request };
};
