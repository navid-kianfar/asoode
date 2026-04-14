# Build context: monorepo root (docker build . -f apps/frontend/Dockerfile)

FROM node:22-alpine AS build

WORKDIR /usr/src/app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/frontend/ ./apps/frontend/

# Build shared package first, then frontend
RUN pnpm --filter @asoode/shared build \
    && pnpm --filter @asoode/frontend build

# Production stage - serve static files with nginx
FROM nginx:alpine AS production

COPY --from=build /usr/src/app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
