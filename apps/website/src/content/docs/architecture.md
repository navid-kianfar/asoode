# Architecture Overview

## System Architecture

Asoode follows a monorepo architecture with three main applications:

### Frontend (Vue 3 + Vite)
- Single Page Application (SPA)
- Vue 3 with Composition API
- Vuetify 3 for Material Design UI
- Pinia for state management
- Socket.IO for real-time updates

### Backend (NestJS)
- RESTful API (all POST endpoints)
- Modular architecture with NestJS modules
- JWT authentication
- Socket.IO WebSocket gateway
- OperationResult&lt;T&gt; response wrapper

### Shared Package
- TypeScript interfaces and enums
- Shared between frontend and backend
- Contains all models, DTOs, and constants

## API Conventions
- All endpoints use POST method
- All responses wrapped in OperationResult&lt;T&gt;
- Authentication via JWT token in Authorization header
- File uploads use multipart/form-data

## Database
- PostgreSQL with TypeORM
- Entity-based data models
- Migrations for schema changes

## Real-Time Communication
- Socket.IO for bidirectional communication
- Used for: task updates, messenger, notifications
- JWT-authenticated WebSocket connections
