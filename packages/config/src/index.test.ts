import { describe, expect, it } from 'vitest';

import { loadConfig } from './index.js';

describe('loadConfig', () => {
  it('uses local runtime defaults', () => {
    const config = loadConfig({ NODE_ENV: 'test' });

    expect(config).toMatchObject({
      environment: 'test',
      http: { host: 'localhost', port: 6969 },
      smtp: {
        enabled: true,
        host: 'localhost',
        port: 1430,
        username: 'msgdock',
        password: 'msgdock',
      },
      sms: { enabled: false, host: 'localhost', port: 1431 },
    });
    expect(config.database.path).toContain('.msgdock');
  });

  it('applies environment overrides', () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      MSGDOCK_HTTP_HOST: '0.0.0.0',
      MSGDOCK_HTTP_PORT: '7000',
      MSGDOCK_SMTP_ENABLED: 'false',
      MSGDOCK_SMTP_PORT: '1500',
      MSGDOCK_SMS_ENABLED: 'true',
      MSGDOCK_DATABASE_PATH: './runtime.sqlite',
    });

    expect(config).toMatchObject({
      environment: 'production',
      http: { host: '0.0.0.0', port: 7000 },
      smtp: { enabled: false, port: 1500 },
      sms: { enabled: true },
      database: { path: './runtime.sqlite' },
    });
  });

  it.each(['0', '65536', 'not-a-port'])(
    'rejects invalid HTTP port %s',
    (port) => {
      expect(() => loadConfig({ MSGDOCK_HTTP_PORT: port })).toThrow(
        'MSGDOCK_HTTP_PORT',
      );
    },
  );

  it('rejects invalid booleans', () => {
    expect(() => loadConfig({ MSGDOCK_SMTP_ENABLED: 'sometimes' })).toThrow(
      'MSGDOCK_SMTP_ENABLED',
    );
  });
});
