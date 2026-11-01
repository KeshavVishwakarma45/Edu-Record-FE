import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

// Waits until `value` has stopped changing for `delay` ms (used for the search box)
function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Loads one page of a server-side list and reloads it when the page, sort, search,
// filters or selected institute change.
//
//   const list = useList(coursesApi.list, { sort: 'name' });
//   <DataTable rows={list.rows} total={list.total} loading={list.loading} error={list.error}
//              params={list.params} onParamsChange={list.setParams} onRetry={list.reload} />
//
// apiFn must be defined outside the component (like coursesApi.list), not created on each render.
export function useList(apiFn, initialParams = {}) {
  const { selectedInstitute } = useAuth();
  const instituteId = selectedInstitute?.id;

  const [params, setParamsState] = useState({ page: 1, limit: 20, search: '', ...initialParams });
  const [reloadCount, setReloadCount] = useState(0);
  const debouncedSearch = useDebouncedValue(params.search, 300);

  // Everything that decides which rows we need, as one string
  const { search: _typedSearch, ...otherParams } = params;
  const requestKey = JSON.stringify({ instituteId, debouncedSearch, otherParams, reloadCount });

  // The last finished request. While its key differs from requestKey, we are loading.
  const [result, setResult] = useState({ key: null, rows: [], total: 0, error: null });

  useEffect(() => {
    if (!instituteId) return undefined;
    let ignore = false; // a slower, older request must not overwrite a newer one
    const { otherParams: query, debouncedSearch: search } = JSON.parse(requestKey);
    apiFn({ ...query, ...(search ? { search } : {}) })
      .then(({ rows, total }) => {
        if (!ignore) setResult({ key: requestKey, rows, total, error: null });
      })
      .catch((error) => {
        if (!ignore) setResult({ key: requestKey, rows: [], total: 0, error });
      });
    return () => {
      ignore = true;
    };
  }, [apiFn, instituteId, requestKey]);

  // Changing anything except the page goes back to page 1
  const setParams = useCallback((changes) => {
    setParamsState((previous) => ({
      ...previous,
      ...changes,
      page: 'page' in changes ? changes.page : 1,
    }));
  }, []);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    rows: result.rows,
    total: result.total,
    loading: result.key !== requestKey,
    error: result.key === requestKey ? result.error : null,
    params,
    setParams,
    reload,
  };
}
