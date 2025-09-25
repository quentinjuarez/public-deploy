# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Running the application with backend services

This project includes a backend service with PostgreSQL and RabbitMQ, containerized with Docker.

### Prerequisites

- Docker
- Docker Compose
- Node.js
- Yarn

### Setup

Before running the application, you need to create the environment files. You can do this by copying the example files:

```bash
cp .env_DEV.example .env_DEV
cp .env_STAGING.example .env_STAGING
cp .env_PROD.example .env_PROD
```

### Running the application

To run the application, you can use the following commands:

- **Development:** `yarn start:dev`
- **Staging:** `yarn start:staging`
- **Production:** `yarn start:prod`

These commands will start the frontend, backend, PostgreSQL, and RabbitMQ services.

### Stopping the application

To stop the application, you can use the following commands:

- **Development:** `yarn stop:dev`
- **Staging:** `yarn stop:staging`
- **Production:** `yarn stop:prod`
