import { useState, useCallback } from 'react';

type MutationFunction<T, U> = (args: T) => Promise<U>;

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

  const mutate = useCallback(async (args: T) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mutationFunc(args);
      setData(result);
    } catch (err: unknown) {
      const mutationError = err instanceof Error ? err : new Error(String(err));
      setError(mutationError);
      throw mutationError;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFunc]);

  return { data, error, isLoading, mutate };
};
