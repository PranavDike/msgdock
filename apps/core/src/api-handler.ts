import type { IncomingMessage, ServerResponse } from 'node:http';

import type {
  Channel,
  ListMessagesQuery,
  MessageStatus,
} from '@msgdock/contracts';
import {
  MessageNotFoundError,
  MessageValidationError,
  UnsupportedQueryError,
} from '@msgdock/core';
import type { EventBus, MessageService } from '@msgdock/core';

interface ErrorPayload {
  error: {
    code: string;
    message: string;
  };
}

type MessageServicePort = Pick<MessageService, 'list' | 'get'>;
interface ApiHandlerOptions {
  eventBus?: EventBus;
}

const channels = new Set<Channel>(['email', 'sms']);
const statuses = new Set<MessageStatus>([
  'queued',
  'sent',
  'delivered',
  'failed',
]);

class InvalidQueryError extends Error {
  override name = 'InvalidQueryError';
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function normalizeBasePath(basePath: string): string {
  if (basePath === '/') return '';

  const normalized = basePath.trim().replace(/\/+$/, '');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function getRoute(pathname: string, basePath: string): string | null {
  if (!basePath) return pathname;
  if (pathname === basePath) return '/';
  if (!pathname.startsWith(`${basePath}/`)) return null;

  return pathname.slice(basePath.length);
}

function parseQuery(searchParams: URLSearchParams): ListMessagesQuery {
  const query: ListMessagesQuery = {};
  const channel = searchParams.get('channel');
  const status = searchParams.get('status');
  const provider = searchParams.get('provider');
  const limit = searchParams.get('limit');
  const cursor = searchParams.get('cursor');

  if (channel) {
    if (!channels.has(channel as Channel)) {
      throw new InvalidQueryError('channel must be email or sms');
    }
    query.channel = channel as Channel;
  }

  if (status) {
    if (!statuses.has(status as MessageStatus)) {
      throw new InvalidQueryError(
        'status must be queued, sent, delivered, or failed',
      );
    }
    query.status = status as MessageStatus;
  }

  if (provider) query.provider = provider;

  if (limit) {
    const parsedLimit = Number(limit);
    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 1000
    ) {
      throw new InvalidQueryError(
        'limit must be an integer between 1 and 1000',
      );
    }
    query.limit = parsedLimit;
  }

  if (cursor) query.cursor = cursor;

  return query;
}

function errorResponse(error: unknown): {
  status: number;
  payload: ErrorPayload;
} {
  if (error instanceof InvalidQueryError) {
    return {
      status: 400,
      payload: { error: { code: 'invalid_query', message: error.message } },
    };
  }

  if (error instanceof UnsupportedQueryError) {
    return {
      status: 400,
      payload: { error: { code: 'unsupported_query', message: error.message } },
    };
  }

  if (error instanceof MessageNotFoundError) {
    return {
      status: 404,
      payload: { error: { code: 'not_found', message: error.message } },
    };
  }

  if (error instanceof MessageValidationError) {
    return {
      status: 400,
      payload: { error: { code: 'invalid_message', message: error.message } },
    };
  }

  return {
    status: 500,
    payload: {
      error: { code: 'internal_error', message: 'Internal server error' },
    },
  };
}

function sendSseHeaders(response: ServerResponse): void {
  response.statusCode = 200;
  response.setHeader('content-type', 'text/event-stream; charset=utf-8');
  response.setHeader('cache-control', 'no-cache');
  response.setHeader('connection', 'keep-alive');
  response.flushHeaders();
}

function writeSseEvent(
  response: ServerResponse,
  event: string,
  data: unknown,
): void {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function createApiHandler(
  service: MessageServicePort,
  basePath = '/api',
  options: ApiHandlerOptions = {},
): (request: IncomingMessage, response: ServerResponse) => void {
  const normalizedBasePath = normalizeBasePath(basePath);

  return (request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const route = getRoute(url.pathname, normalizedBasePath);

    if (request.method !== 'GET') {
      sendJson(response, 405, {
        error: { code: 'method_not_allowed', message: 'Only GET is supported' },
      });
      return;
    }

    if (route === null) {
      sendJson(response, 404, {
        error: { code: 'not_found', message: 'Route not found' },
      });
      return;
    }

    void (async () => {
      try {
        if (route === '/health') {
          sendJson(response, 200, { status: 'ok', service: 'msgdock-core' });
          return;
        }

        if (route === '/messages/stream') {
          if (!options.eventBus) {
            sendJson(response, 404, {
              error: { code: 'not_found', message: 'Route not found' },
            });
            return;
          }

          sendSseHeaders(response);

          const unsubscribe = options.eventBus.subscribe(
            'message.created',
            (event) => {
              if (response.writableEnded) {
                unsubscribe();
                return;
              }

              writeSseEvent(response, event.type, event);
            },
          );

          request.on('close', unsubscribe);
          return;
        }

        if (route === '/messages') {
          const messages = await service.list(parseQuery(url.searchParams));
          sendJson(response, 200, { data: messages });
          return;
        }

        if (route.startsWith('/messages/')) {
          const id = decodeURIComponent(route.slice('/messages/'.length));
          const message = await service.get(id);
          sendJson(response, 200, { data: message });
          return;
        }

        sendJson(response, 404, {
          error: { code: 'not_found', message: 'Route not found' },
        });
      } catch (error) {
        const result = errorResponse(error);
        sendJson(response, result.status, result.payload);
      }
    })();
  };
}
