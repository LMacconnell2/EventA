# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24-alpine
ARG PNPM_VERSION=10.12.3

# ---------------------------------------------------------------------------
# Base build environment
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
# Build the React/Vite application
# ---------------------------------------------------------------------------
FROM dependencies AS build

ARG VITE_API_URL=http://localhost:3000
ARG VITE_STRIPE_PUBLISHABLE_KEY=""

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}

COPY apps/client ./apps/client

RUN pnpm --filter @eventa/client build


# ---------------------------------------------------------------------------
# Production runtime
# ---------------------------------------------------------------------------
FROM nginx:stable-alpine AS runtime

COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build \
    /app/apps/client/dist \
    /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=5s \
    --retries=3 \
    CMD wget -qO- http://localhost/health >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]