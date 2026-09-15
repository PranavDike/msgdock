import {
  createServer,
  request as httpRequest,
  type RequestListener,
} from 'node:http';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createApplicationHandler } from './application-handler.js';

interface HttpResult {
  statusCode: number;
  body: string;
  contentType: string | undefined;
}

const servers: ReturnType<typeof createServer>[] = [];
const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          if (!server.listening) return resolve();
          server.close(() => resolve());
        }),
    ),
  );
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true })),
  );
});

async function createFixture(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'msgdock-web-'));
  directories.push(directory);
  await writeFile(join(directory, 'index.html'), '<html>MsgDock UI</html>');
  await writeFile(join(directory, 'assets.js'), 'console.log("asset");');
  return directory;
}

async function startServer(
  listener: RequestListener,
): Promise<{ port: number }> {
  const server = createServer(listener);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Server did not start');
  return { port: address.port };
}

async function request(
  port: number,
  path: string,
  headers: Record<string, string> = {},
): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      { hostname: '127.0.0.1', port, path, headers },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () =>
          resolve({
            statusCode: response.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8'),
            contentType: response.headers['content-type'],
          }),
        );
      },
    );
    request.on('error', reject);
    request.end();
  });
}

describe('application HTTP handler', () => {
  it('serves the SPA, assets, and mounted API without mixing their fallbacks', async () => {
    const staticRoot = await createFixture();
    const apiHandler: RequestListener = (_request, response) => {
      response.statusCode = 200;
      response.setHeader('content-type', 'application/json');
      response.end('{"source":"api"}');
    };
    const { port } = await startServer(
      createApplicationHandler({
        staticRoot,
        apiMounts: [
          { path: '/api', handler: apiHandler },
          { host: 'api.msgdock.dev', path: '/', handler: apiHandler },
        ],
      }),
    );

    const home = await request(port, '/');
    const clientRoute = await request(port, '/messages');
    const asset = await request(port, '/assets.js');
    const missingAsset = await request(port, '/missing.js');
    const missingViteAsset = await request(port, '/assets/missing');
    const localApi = await request(port, '/api/messages');
    const hostedApi = await request(port, '/messages', {
      host: 'api.msgdock.dev',
    });

    expect(home).toMatchObject({
      statusCode: 200,
      body: '<html>MsgDock UI</html>',
    });
    expect(clientRoute).toMatchObject({
      statusCode: 200,
      body: '<html>MsgDock UI</html>',
    });
    expect(asset).toMatchObject({
      statusCode: 200,
      body: 'console.log("asset");',
    });
    expect(asset.contentType).toContain('javascript');
    expect(missingAsset).toMatchObject({ statusCode: 404 });
    expect(missingAsset.body).not.toContain('MsgDock UI');
    expect(missingViteAsset).toMatchObject({ statusCode: 404 });
    expect(missingViteAsset.body).not.toContain('MsgDock UI');
    expect(localApi).toMatchObject({
      statusCode: 200,
      body: '{"source":"api"}',
    });
    expect(hostedApi).toMatchObject({
      statusCode: 200,
      body: '{"source":"api"}',
    });
  });

  it('rejects traversal attempts instead of reading outside the static root', async () => {
    const staticRoot = await createFixture();
    const { port } = await startServer(
      createApplicationHandler({ staticRoot, apiMounts: [] }),
    );

    const response = await request(port, '/%2e%2e/%2e%2e/secret.txt');

    expect(response.statusCode).toBe(404);
  });
});
