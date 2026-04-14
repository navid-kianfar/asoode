# Build context: monorepo root (docker build . -f apps/website/Dockerfile)

FROM node:22-alpine AS build

WORKDIR /usr/src/app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/website/package.json ./apps/website/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/website/ ./apps/website/

# Build website (vite build — static site)
RUN pnpm --filter @asoode/website build

# Production stage — serve static files with nginx
FROM nginx:alpine AS production

COPY --from=build /usr/src/app/apps/website/dist /usr/share/nginx/html
COPY apps/website/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
