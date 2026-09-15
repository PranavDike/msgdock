import { readFile, stat } from 'node:fs/promises';
import type {
  IncomingMessage,
  RequestListener,
  ServerResponse,
} from 'node:http';
import { extname, relative, resolve } from 'node:path';

export interface ApiMount {
  path: string;
  handler: RequestListener;
  host?: string;
}

export interface ApplicationHandlerOptions {
  apiMounts: ApiMount[];
  staticRoot: string;
}

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function normalizeMountPath(path: string): string {
  if (path === '/') return '';

  const normalized = path.trim().replace(/\/+$/, '');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function normalizeHost(host: string): string {
  const normalized = host.trim().toLowerCase();
  if (normalized.startsWith('[')) {
    const closingBracket = normalized.indexOf(']');
    return closingBracket === -1
      ? normalized
      : normalized.slice(1, closingBracket);
  }

  return normalized.split(':')[0] ?? normalized;
}

function requestHost(request: IncomingMessage): string {
  return normalizeHost(request.headers.host ?? '');
}

function matchesMount(
  request: IncomingMessage,
  pathname: string,
  mount: ApiMount,
): boolean {
  if (mount.host && normalizeHost(mount.host) !== requestHost(request)) {
    return false;
  }

  const mountPath = normalizeMountPath(mount.path);
  return (
    mountPath === '' ||
    pathname === mountPath ||
    pathname.startsWith(`${mountPath}/`)
  );
}

function sendText(
  response: ServerResponse,
  statusCode: number,
  body: string,
): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'text/plain; charset=utf-8');
  response.end(body);
}

function isInsideRoot(root: string, filePath: string): boolean {
  const relativePath = relative(root, filePath);
  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !relativePath.includes('..\\'))
  );
}

function decodePath(pathname: string): string | null {
  try {
    const decoded = decodeURIComponent(pathname);
    return decoded.includes('\0') ? null : decoded;
  } catch {
    return null;
  }
}

function contentType(filePath: string): string {
  return (
    contentTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
  );
}

async function existingFile(filePath: string): Promise<boolean> {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function serveStatic(
  request: IncomingMessage,
  response: ServerResponse,
  staticRoot: string,
): Promise<void> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendText(response, 405, 'Method Not Allowed');
    return;
  }

  const url = new URL(request.url ?? '/', 'http://localhost');
  const decodedPath = decodePath(url.pathname);
  if (!decodedPath || !decodedPath.startsWith('/')) {
    sendText(response, 404, 'Not Found');
    return;
  }

  const root = resolve(staticRoot);
  const relativePath =
    decodedPath === '/' ? 'index.html' : decodedPath.slice(1);
  const requestedFile = resolve(root, relativePath);
  if (!isInsideRoot(root, requestedFile)) {
    sendText(response, 404, 'Not Found');
    return;
  }

  const assetRequest =
    decodedPath.startsWith('/assets/') ||
    (decodedPath !== '/' && extname(decodedPath) !== '');
  const filePath = (await existingFile(requestedFile))
    ? requestedFile
    : assetRequest
      ? null
      : resolve(root, 'index.html');

  if (
    !filePath ||
    !isInsideRoot(root, filePath) ||
    !(await existingFile(filePath))
  ) {
    sendText(response, 404, 'Not Found');
    return;
  }

  const body = await readFile(filePath);
  response.statusCode = 200;
  response.setHeader('content-type', contentType(filePath));
  response.setHeader('content-length', body.byteLength);
  response.end(request.method === 'HEAD' ? undefined : body);
}

export function createApplicationHandler(
  options: ApplicationHandlerOptions,
): RequestListener {
  const mounts = [...options.apiMounts].sort(
    (left, right) =>
      normalizeMountPath(right.path).length -
      normalizeMountPath(left.path).length,
  );

  return (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const mount = mounts.find((candidate) =>
      matchesMount(request, pathname, candidate),
    );

    if (mount) {
      mount.handler(request, response);
      return;
    }

    void serveStatic(request, response, options.staticRoot).catch(() => {
      if (!response.headersSent)
        sendText(response, 500, 'Internal Server Error');
      else response.destroy();
    });
  };
}
