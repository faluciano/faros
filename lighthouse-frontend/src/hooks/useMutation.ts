import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

type MutationFunction<T, U> = (token: string, args: T) => Promise<U>;

interface UseMutationResult<T, U> {
  data: U | null;
  error: Error | null;
  isLoading: boolean;
  mutate: (args: T) => Promise<void>;
}

export const useMutation = <T, U>(mutationFunc: MutationFunction<T, U>): UseMutationResult<T, U> => {
  const [data, setData] = useState<U | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const mutate = useCallback(async (args: T) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        throw new Error("User is not authenticated.");
      }
      const result = await mutationFunc(token, args);
      setData(result);
    } catch (err: unknown) {
      const mutationError = err instanceof Error ? err : new Error(String(err));
      setError(mutationError);
      throw mutationError;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFunc, getToken]);

  return { data, error, isLoading, mutate };
};
