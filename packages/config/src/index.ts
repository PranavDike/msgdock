import path from 'node:path';

export type RuntimeEnvironment = 'development' | 'test' | 'production';

export interface MsgDockConfig {
  environment: RuntimeEnvironment;
  http: {
    host: string;
    port: number;
    basePath: string;
  };
  smtp: {
    enabled: boolean;
    host: string;
    port: number;
    username: string;
    password: string;
  };
  sms: {
    enabled: boolean;
    host: string;
    port: number;
  };
  database: {
    path: string;
  };
}

function parsePort(name: string, value: string | undefined, fallback: number) {
  const raw = value ?? String(fallback);
  const port = Number(raw);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`${name} must be an integer between 1 and 65535`);
  }

  return port;
}

function parseBoolean(
  name: string,
  value: string | undefined,
  fallback: boolean,
) {
  if (value === undefined) return fallback;

  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new Error(`${name} must be either true or false`);
}

function parseEnvironment(value: string | undefined): RuntimeEnvironment {
  const environment = value ?? 'development';

  if (
    environment !== 'development' &&
    environment !== 'test' &&
    environment !== 'production'
  ) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  return environment;
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): MsgDockConfig {
  return {
    environment: parseEnvironment(env.NODE_ENV),
    http: {
      host: env.MSGDOCK_HTTP_HOST ?? 'localhost',
      port: parsePort('MSGDOCK_HTTP_PORT', env.MSGDOCK_HTTP_PORT, 6969),
      basePath: env.MSGDOCK_API_BASE_PATH ?? '/api',
    },
    smtp: {
      enabled: parseBoolean(
        'MSGDOCK_SMTP_ENABLED',
        env.MSGDOCK_SMTP_ENABLED,
        true,
      ),
      host: env.MSGDOCK_SMTP_HOST ?? 'localhost',
      port: parsePort('MSGDOCK_SMTP_PORT', env.MSGDOCK_SMTP_PORT, 1430),
      username: env.MSGDOCK_SMTP_USER ?? 'msgdock',
      password: env.MSGDOCK_SMTP_PASSWORD ?? 'msgdock',
    },
    sms: {
      enabled: parseBoolean(
        'MSGDOCK_SMS_ENABLED',
        env.MSGDOCK_SMS_ENABLED,
        false,
      ),
      host: env.MSGDOCK_SMS_HOST ?? 'localhost',
      port: parsePort('MSGDOCK_SMS_PORT', env.MSGDOCK_SMS_PORT, 1431),
    },
    database: {
      path:
        env.MSGDOCK_DATABASE_PATH ??
        path.resolve(process.cwd(), '.msgdock', 'msgdock.sqlite'),
    },
  };
}

export const getConfig = loadConfig;
