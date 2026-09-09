import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { MessagesApi } from '@msgdock/contracts';

import { useMessage, useMessages } from './use-message-data';

const message = {
  id: 'msg_test',
  channel: 'email' as const,
  provider: 'mock-email',
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
