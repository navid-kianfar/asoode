# Build context: monorepo root (docker build . -f apps/frontend/Dockerfile)

FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Establish pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy ALL package.json files to satisfy pnpm workspace requirements
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/socket/package.json ./apps/socket/
COPY apps/worker/package.json ./apps/worker/
COPY apps/website/package.json ./apps/website/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and config
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/frontend/ ./apps/frontend/

# Build shared package first, then frontend
# Usually Vite apps need environment variables at build time.
# We pass them as ARG if necessary, then export as ENV.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @asoode/shared build \
    && pnpm --filter @asoode/frontend build

# Production stage - serve static files with nginx
FROM nginx:alpine AS production

# Copy the built assets from the build stage
COPY --from=build /usr/src/app/apps/frontend/dist /usr/share/nginx/html

# Copy custom nginx configuration if provided
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || \
    echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

# Add entrypoint for potential runtime env injection
COPY apps/frontend/docker-entrypoint.sh /docker-entrypoint.sh 2>/dev/null || \
    echo "#!/bin/sh\nexec nginx -g 'daemon off;'" > /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
