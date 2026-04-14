# Asoode Socket Server

Real-time WebSocket notification server for Asoode, built with NestJS 11.

## Features

- Real-time WebSocket notifications via Socket.IO
- Web Push notifications via VAPID / web-push
- RabbitMQ message queue consumption with automatic reconnection and exponential backoff
- Multi-language queue support (en / fa / ar)
- Proper graceful shutdown with connection cleanup
- Docker-ready with health checks and signal handling

## Prerequisites

- Node.js 22+
- pnpm
- RabbitMQ instance

## Setup

1. Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
pnpm install
```

3. Start in development mode:

```bash
pnpm start:dev
```

## Scripts

| Command | Description |
|---|---|
| `pnpm start` | Start the server |
| `pnpm start:dev` | Start with watch mode |
| `pnpm start:debug` | Start with debug + watch |
| `pnpm start:prod` | Start production build |
| `pnpm build` | Compile TypeScript |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LANGUAGE` | No | `en` | Language / queue suffix (`en`, `fa`, `ar`) |
| `PORT` | No | `8020` | HTTP/WebSocket port |
| `BACKEND_SERVER` | No | `0.0.0.0` | Bind address |
| `RABBITMQ_URL` | Yes | - | RabbitMQ connection URL |
| `QUEUE_PREFIX` | No | `asoode` | Queue name prefix |
| `VAPID_EMAIL` | Yes | - | VAPID contact email |
| `VAPID_PUBLIC_KEY` | Yes | - | VAPID public key |
| `VAPID_PRIVATE_KEY` | Yes | - | VAPID private key |

## Docker

```bash
# Build
docker build -t asoode-socket .

# Run
docker run -p 8020:8020 --env-file .env asoode-socket
```

The container includes:
- `tini` for proper PID 1 signal handling
- Health check on `GET /` endpoint
- Automatic RabbitMQ reconnection (no `wait-for-it` needed)

## Architecture

```
src/
  server.ts                          # Bootstrap / entry point
  config/
    configuration.ts                 # Typed config registration
    config.validation.ts             # Joi env validation schema
  queue/
    queue.module.ts                  # Global queue module
    queue.service.ts                 # RabbitMQ connection lifecycle
    queue.constants.ts               # Queue name constants
  app/
    app.module.ts                    # Root application module
    dtos.ts                          # Notification interfaces
    controllers/
      health.controller.ts           # Health check endpoint
    gateways/
      main.gateway.ts                # WebSocket gateway
    services/
      notification.service.ts        # Socket user tracking & emit
      push.service.ts                # Web push delivery
      message-handler.service.ts     # Queue message processing
```
