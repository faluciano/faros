import { useState, useCallback } from 'react';

type ApiFunction<T> = (...args: unknown[]) => Promise<T>;

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

  const request = useCallback(async (...args: unknown[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiFunc(...args);
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
  }, [apiFunc]);

  return { data, error, isLoading, request };
};
