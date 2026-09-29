# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json .npmrc tsconfig.json ./
COPY apps/core/package.json apps/core/
COPY apps/web/package.json apps/web/
COPY packages/api-client/package.json packages/api-client/
COPY packages/config/package.json packages/config/
COPY packages/contracts/package.json packages/contracts/
COPY packages/core/package.json packages/core/
COPY packages/protocol-smtp/package.json packages/protocol-smtp/
COPY packages/protocol-sms/package.json packages/protocol-sms/
COPY packages/protocols/package.json packages/protocols/
COPY packages/providers/package.json packages/providers/
COPY packages/storage-sqlite/package.json packages/storage-sqlite/

ENV HUSKY=0

RUN npm ci

COPY . .

RUN npm run build \
  && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
  MSGDOCK_HTTP_HOST=0.0.0.0 \
  MSGDOCK_SMTP_HOST=0.0.0.0 \
  MSGDOCK_SMS_HOST=0.0.0.0 \
  MSGDOCK_DATABASE_PATH=/data/msgdock.sqlite

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps ./apps
COPY --from=build /app/packages ./packages

RUN mkdir -p /data \
  && chown -R node:node /app /data

USER node

VOLUME ["/data"]

EXPOSE 6969 1430 1431

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:6969/api/health').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"

CMD ["node", "apps/core/dist/cli.js"]
