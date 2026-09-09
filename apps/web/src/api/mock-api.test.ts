import { describe, expect, it } from 'vitest';

import { createMockMessagesApi } from './mock-api';

describe('createMockMessagesApi', () => {
  it('connects the web app to the mock message transport through the API client', async () => {
    const api = createMockMessagesApi();

    const response = await api.list({ channel: 'email' });

    expect(response.data).toHaveLength(4);
    expect(response.data[0]?.channel).toBe('email');
  });
});
