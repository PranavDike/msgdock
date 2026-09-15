import { useEffect, useState } from 'react';

import type {
  ListMessagesQuery,
  Message,
  MessagesApi,
} from '@msgdock/contracts';

interface AsyncState<T> {
  data: T;
  error: Error | null;
  isLoading: boolean;
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error('Something went wrong');
}

export function useMessages(
  api: MessagesApi,
  query: ListMessagesQuery,
): AsyncState<Message[]> {
  const [state, setState] = useState<AsyncState<Message[]>>({
    data: [],
    error: null,
    isLoading: true,
  });
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    let cancelled = false;

    setState((current) => ({ ...current, error: null, isLoading: true }));

    api
      .list(query)
      .then((response) => {
        if (cancelled) return;
        setState({ data: response.data, error: null, isLoading: false });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({ data: [], error: toError(error), isLoading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [api, queryKey]);

  return state;
}

export function useMessage(
  api: MessagesApi,
  id: string | null,
): AsyncState<Message | null> {
  const [state, setState] = useState<AsyncState<Message | null>>({
    data: null,
    error: null,
    isLoading: Boolean(id),
  });

  useEffect(() => {
    let cancelled = false;

    if (!id) {
      setState({ data: null, error: null, isLoading: false });
      return () => {
        cancelled = true;
      };
    }

    setState((current) => ({ ...current, error: null, isLoading: true }));

    api
      .get(id)
      .then((response) => {
        if (cancelled) return;
        setState({ data: response.data, error: null, isLoading: false });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({ data: null, error: toError(error), isLoading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [api, id]);

  return state;
}
