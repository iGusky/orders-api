import { useCallback, useEffect, useRef, useState } from 'react';

export interface QueryState<T> {
  status: 'loading' | 'error' | 'success';
  data?: T;   // se conserva el último resultado mientras carga el siguiente
}

// Ejecuta `fetcher` cada vez que cambia `key` y cancela la petición anterior.
// `key` debe incluir todo lo que cambia la petición (página, búsqueda…).
export function useQuery<T>(key: string, fetcher: (signal: AbortSignal) => Promise<T>) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [state, setState] = useState<QueryState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ status: 'loading', data: prev.data }));

    fetcherRef.current(controller.signal)
      .then((data) => setState({ status: 'success', data }))
      .catch(() => {
        if (!controller.signal.aborted) setState((prev) => ({ status: 'error', data: prev.data }));
      });

    return () => controller.abort();
  }, [key, attempt]);

  const refetch = useCallback(() => setAttempt((n) => n + 1), []);

  return { ...state, refetch };
}
