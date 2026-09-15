import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { loadConfig } from '@msgdock/config';

import { createRuntime } from './runtime.js';

export async function main(): Promise<void> {
  const runtime = createRuntime(loadConfig());
  await runtime.start();

  const httpAddress = runtime.httpAddress();
  const smtpAddress = runtime.smtpAddress();
  console.log(
    `MsgDock listening on HTTP ${httpAddress?.address ?? 'configured host'}:${httpAddress?.port ?? 'configured port'}`,
  );
  if (smtpAddress) {
    console.log(
      `SMTP ingestion listening on ${smtpAddress.address}:${smtpAddress.port}`,
    );
  }

  let stopping = false;
  const shutdown = async () => {
    if (stopping) return;
    stopping = true;
    await runtime.stop();
  };

  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
}

const entrypoint = process.argv[1];
if (entrypoint && import.meta.url === pathToFileURL(resolve(entrypoint)).href) {
  void main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
