import { useState, useCallback } from 'react';

/**
 * Generic hook for async operations with loading/error/data state.
 * Usage:
 *   const { execute, loading, error, data } = useAsync(myApiFn);
 *   await execute(arg1, arg2);
 */
const useAsync = (asyncFn) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const result = await asyncFn(...args);
        setData(result.data);
        return result.data;
      } catch (err) {
        const message =
          err.response?.data?.message || err.message || 'Something went wrong';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  return { execute, loading, error, data };
};

export default useAsync;
