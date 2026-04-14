# Build context: monorepo root (docker build . -f apps/worker/Dockerfile)

FROM node:22-alpine AS build

WORKDIR /usr/src/app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/worker/package.json ./apps/worker/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.base.json ./
COPY apps/worker/ ./apps/worker/

# Build worker
RUN pnpm --filter @asoode/worker build

# Deploy worker to a standalone directory with production deps only
RUN pnpm --filter @asoode/worker deploy --legacy --prod /prod

# Copy email templates from backend
COPY apps/backend/templates/ /prod/templates/

# Production stage
FROM node:22-alpine AS production

RUN apk add --no-cache tini

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /prod/node_modules ./node_modules
COPY --chown=node:node --from=build /prod/dist ./dist
COPY --chown=node:node --from=build /prod/templates ./templates
COPY --chown=node:node --from=build /prod/package.json ./

ENV TEMPLATES_DIR=./templates

USER node

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
