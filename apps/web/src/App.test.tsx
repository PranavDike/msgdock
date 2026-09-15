import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Message, MessagesApi } from '@msgdock/contracts';

import App from './App';

afterEach(() => {
  cleanup();
});

const emailMessage: Message = {
  id: 'msg_test_email',
  channel: 'email',
  provider: 'mock-email',
  status: 'delivered',
  from: 'hello@msgdock.local',
  to: 'developer@example.com',
  subject: 'Test message',
  body: 'This is a test message.',
  createdAt: '2026-09-02T09:00:00.000Z',
};

const workspaceMessage: Message = {
  id: 'msg_workspace_email',
  channel: 'email',
  provider: 'smtp',
  status: 'delivered',
  from: 'hello@example.com',
  to: 'developer@example.com',
  subject: 'Welcome to MsgDock',
  body: 'This is a development email.',
  createdAt: '2026-09-02T09:05:00.000Z',
};
function createApi(overrides: Partial<MessagesApi> = {}): MessagesApi {
  return {
    list: vi.fn().mockResolvedValue({ data: [emailMessage] }),
    get: vi.fn().mockResolvedValue({ data: emailMessage }),
    ...overrides,
  };
}

describe('MsgDock message workspace', () => {
  it('renders messages from the configured API client and updates the inspector', async () => {
    const api = createApi({
      list: vi.fn().mockResolvedValue({ data: [workspaceMessage] }),
      get: vi.fn().mockResolvedValue({ data: workspaceMessage }),
    });
    render(<App api={api} />);

    const messageRow = await screen.findByRole('button', {
      name: /Welcome to MsgDock/,
    });
    fireEvent.click(messageRow);

    expect(
      await within(screen.getByRole('complementary')).findByText(
        'developer@example.com',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('This is a development email.'),
    ).toBeInTheDocument();
  });

  it('shows loading, empty, and error list states', async () => {
    let resolveList: (value: { data: Message[] }) => void = () => undefined;
    const pendingList = new Promise<{ data: Message[] }>((resolve) => {
      resolveList = resolve;
    });
    const loadingApi = createApi({
      list: vi.fn().mockReturnValue(pendingList),
    });
    const { unmount } = render(<App api={loadingApi} />);

    expect(screen.getByLabelText('Loading messages')).toBeInTheDocument();
    resolveList({ data: [] });
    expect(
      await screen.findByText('No messages in this view'),
    ).toBeInTheDocument();

    unmount();
    const errorApi = createApi({
      list: vi.fn().mockRejectedValue(new Error('Service unavailable')),
    });
    render(<App api={errorApi} />);

    expect(
      await screen.findByText('Unable to load messages'),
    ).toBeInTheDocument();
    expect(screen.getByText('Service unavailable')).toBeInTheDocument();
  });

  it('requests the active channel and filters through the API query', async () => {
    const list = vi.fn().mockResolvedValue({ data: [emailMessage] });
    const api = createApi({ list });
    render(<App api={api} />);

    await waitFor(() => expect(list).toHaveBeenCalledWith({}));
    fireEvent.click(screen.getByRole('button', { name: 'Email' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith({ channel: 'email' }),
    );
  });

  it('does not render the message inbox for providers or settings', () => {
    render(<App api={createApi()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Providers' }));

    expect(screen.queryByText('message stream')).not.toBeInTheDocument();
    expect(screen.getByText('No providers configured')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.queryByText('message stream')).not.toBeInTheDocument();
    expect(screen.getByText('Nothing to configure yet')).toBeInTheDocument();
  });

  it('shows an inspector error when the selected message is no longer available', async () => {
    const api = createApi({
      get: vi
        .fn()
        .mockRejectedValue(new Error('Message not found: msg_test_email')),
    });
    render(<App api={api} />);

    fireEvent.click(
      await screen.findByRole('button', { name: /Test message/ }),
    );

    expect(
      await screen.findByText('Unable to load message'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Message not found: msg_test_email'),
    ).toBeInTheDocument();
  });
});
