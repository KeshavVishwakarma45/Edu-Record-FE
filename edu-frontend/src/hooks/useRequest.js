import { useCallback, useState } from 'react';

// For one action such as save or delete:
//   const createRequest = useRequest(coursesApi.create);
//   await createRequest.run(data);     // throws the API error, so the caller can react to it
//   <Button loading={createRequest.loading}>Save</Button>
export function useRequest(apiFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        return await apiFn(...args);
      } catch (requestError) {
        setError(requestError);
        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [apiFn],
  );

  return { run, loading, error };
}
