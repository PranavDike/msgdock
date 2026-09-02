export interface MsgDockConfig {
  apiBaseUrl: string;
  environment: 'development' | 'test' | 'production';
}

export function getConfig(): MsgDockConfig {
  return {
    apiBaseUrl: process.env.MSGDOCK_API_URL ?? 'http://localhost:3000',
    environment:
      (process.env.NODE_ENV as MsgDockConfig['environment']) ?? 'development',
  };
}
