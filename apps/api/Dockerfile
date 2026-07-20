# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24-alpine
ARG PNPM_VERSION=10.12.3

# ---------------------------------------------------------------------------
# Base pnpm build environment
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS base

ARG PNPM_VERSION

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable \
    && corepack prepare "pnpm@${PNPM_VERSION}" --activate

WORKDIR /app


# ---------------------------------------------------------------------------
# Install workspace dependencies
# ---------------------------------------------------------------------------
FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/client/package.json ./apps/client/package.json

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile


# ---------------------------------------------------------------------------
# Compile the API
# ---------------------------------------------------------------------------
FROM dependencies AS build

COPY apps/api ./apps/api

RUN pnpm --filter @eventa/api build


# ---------------------------------------------------------------------------
# Create a production-only deployable API directory
# ---------------------------------------------------------------------------
FROM build AS deploy

RUN pnpm --filter @eventa/api deploy \
    --prod \
    /prod/api


# ---------------------------------------------------------------------------
# Production runtime
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app

# Production package files and dependencies.
COPY --from=deploy --chown=node:node /prod/api ./

# Compiled API output.
COPY --from=build --chown=node:node \
    /app/apps/api/dist \
    ./dist

# Database initialization script.
COPY --chown=node:node \
    apps/api/docker/startup.sh \
    /app/docker/startup.sh

RUN chmod +x /app/docker/startup.sh

USER node

EXPOSE 3000

CMD ["node", "dist/database/runBetterAuthMigrations.js"]