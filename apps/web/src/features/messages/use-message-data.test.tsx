import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { MessagesApi } from '@msgdock/contracts';

import { useMessage, useMessages } from './use-message-data';

const message = {
  id: 'msg_test',
  channel: 'email' as const,
  provider: 'test-email',
  status: 'delivered' as const,
  from: 'hello@msgdock.local',
  to: 'developer@example.com',
  subject: 'Test message',
  body: 'This is a test message.',
  createdAt: '2026-09-02T09:00:00.000Z',
};

function createApi(overrides: Partial<MessagesApi> = {}): MessagesApi {
  return {
    list: vi.fn().mockResolvedValue({ data: [message] }),
    get: vi.fn().mockResolvedValue({ data: message }),
    subscribe: vi.fn(() => () => {}),
    ...overrides,
  };
}

describe('useMessages', () => {
  it('loads messages with the requested query', async () => {
    const list = vi.fn().mockResolvedValue({ data: [message] });
    const api = createApi({ list });
    const query = { channel: 'email' as const, status: 'delivered' as const };

    const { result } = renderHook(() => useMessages(api, query));

    await waitFor(() => expect(result.current.data).toEqual([message]));
    expect(list).toHaveBeenCalledWith(query);
    expect(result.current.error).toBeNull();
  });

  it('exposes loading and error state', async () => {
    const list = vi.fn().mockRejectedValue(new Error('Service unavailable'));
    const api = createApi({ list });
    const { result } = renderHook(() => useMessages(api, {}));

    await waitFor(() =>
      expect(result.current.error?.message).toBe('Service unavailable'),
    );
    expect(result.current.data).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('adds newly created messages to the inbox', async () => {
    let handler: Parameters<MessagesApi['subscribe']>[1] | undefined;

    const subscribe = vi.fn(
      (
        _type: 'message.created',
        nextHandler: Parameters<MessagesApi['subscribe']>[1],
      ) => {
        handler = nextHandler;
        return vi.fn();
      },
    );

    const api = createApi({ subscribe });
    const { result } = renderHook(() => useMessages(api, {}));

    await waitFor(() => expect(result.current.data).toEqual([message]));

    const newMessage = {
      ...message,
      id: 'msg_new',
      subject: 'New message',
      createdAt: '2026-09-02T10:00:00.000Z',
    };

    handler?.({
      type: 'message.created',
      message: newMessage,
      occurredAt: newMessage.createdAt,
    });

    await waitFor(() =>
      expect(result.current.data).toEqual([newMessage, message]),
    );

    expect(subscribe).toHaveBeenCalledWith(
      'message.created',
      expect.any(Function),
    );
  });

  it('does not add duplicate messages from the event stream', async () => {
    let handler: Parameters<MessagesApi['subscribe']>[1] | undefined;

    const subscribe = vi.fn(
      (
        _type: 'message.created',
        nextHandler: Parameters<MessagesApi['subscribe']>[1],
      ) => {
        handler = nextHandler;
        return vi.fn();
      },
    );

    const api = createApi({ subscribe });
    const { result } = renderHook(() => useMessages(api, {}));

    await waitFor(() => expect(result.current.data).toEqual([message]));

    handler?.({
      type: 'message.created',
      message,
      occurredAt: message.createdAt,
    });

    await waitFor(() => expect(result.current.data).toEqual([message]));
  });

  it('unsubscribes from message events when unmounted', async () => {
    const unsubscribe = vi.fn();
    const subscribe = vi.fn(() => unsubscribe);
    const api = createApi({ subscribe });

    const { unmount } = renderHook(() => useMessages(api, {}));

    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    unmount();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('refreshes messages using the current query', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({ data: [message] })
      .mockResolvedValueOnce({
        data: [
          {
            ...message,
            id: 'msg_refreshed',
            subject: 'Refreshed message',
          },
        ],
      });

    const api = createApi({ list });
    const query = { channel: 'email' as const };

    const { result } = renderHook(() => useMessages(api, query));

    await waitFor(() => expect(result.current.data).toEqual([message]));

    result.current.refresh();

    await waitFor(() =>
      expect(result.current.data).toEqual([
        {
          ...message,
          id: 'msg_refreshed',
          subject: 'Refreshed message',
        },
      ]),
    );

    expect(list).toHaveBeenCalledTimes(2);
    expect(list).toHaveBeenNthCalledWith(1, query);
    expect(list).toHaveBeenNthCalledWith(2, query);
  });
});

describe('useMessage', () => {
  it('loads the selected message from the API', async () => {
    const get = vi.fn().mockResolvedValue({ data: message });
    const api = createApi({ get });

    const { result } = renderHook(() => useMessage(api, message.id));

    await waitFor(() => expect(result.current.data).toEqual(message));
    expect(get).toHaveBeenCalledWith(message.id);
  });

  it('returns an empty selection without requesting a message', async () => {
    const get = vi.fn();
    const api = createApi({ get });
    const { result } = renderHook(() => useMessage(api, null));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });
});
