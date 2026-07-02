# syntax=docker/dockerfile:1
# ---- base: install workspace deps + build the shared engine ----
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app
COPY pnpm-workspace.yaml package.json ./
COPY pnpm-lock.yaml* ./
COPY packages/engine/package.json packages/engine/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm --filter @demiurge/engine build

# ---- api build ----
FROM base AS api-build
RUN pnpm --filter api build

# ---- api runtime ----
FROM node:22-alpine AS api
RUN corepack enable
WORKDIR /app
COPY --from=api-build /app /app
WORKDIR /app/apps/api
EXPOSE 3001
# cwd = apps/api so the /assets static path resolves to ../../assets
CMD ["node", "dist/main.js"]

# ---- web build ----
FROM base AS web-build
RUN pnpm --filter web build

# ---- web runtime ----
FROM node:22-alpine AS web
RUN corepack enable
WORKDIR /app
COPY --from=web-build /app /app
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
