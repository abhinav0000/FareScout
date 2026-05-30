# FareScout

FareScout is a Node.js + TypeScript Telegram bot for India intercity bus fare tracking, forecasting, and booking-time recommendations.

## Features

- Telegram bot commands for tracking trips and viewing forecasts.
- Fastify API server with health check and Telegram webhook support.
- PostgreSQL persistence through Prisma.
- BullMQ + Redis background worker for fare collection jobs.
- Mock fare provider for local development before partner API credentials exist.
- Baseline forecast engine that predicts the lowest likely future fare.
- PNG forecast chart generation for Telegram responses.
- Tests for command parsing, forecasting, provider behavior, and chart rendering.

## Tech Stack

- Node.js
- TypeScript
- grammY
- Fastify
- Prisma
- PostgreSQL
- Redis
- BullMQ
- Chart.js
- Vitest

## Local Setup

```powershell
cp .env.example .env
npm.cmd install
docker compose up -d
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
```

Add your Telegram bot token to `.env`:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## Run Locally

Start the background worker:

```powershell
npm.cmd run worker
```

In another terminal, run the bot in polling mode:

```powershell
npx.cmd tsx src/polling.ts
```

For webhook/API mode:

```powershell
npm.cmd run dev
```

Health check:

```powershell
curl http://localhost:3000/health
```

## Telegram commands

- `/start`
- `/help`
- `/track Mumbai Pune 2026-06-12 sleeper ac 18:00-23:59`
- `/trips`
- `/forecast <trip_id>`
- `/untrack <trip_id>`

Example:

```text
/track Mumbai Pune 2026-06-12 sleeper ac 18:00-23:59
```

## Test

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run lint
```

## Data source note

The default provider is a deterministic mock simulator. Replace it by implementing the `FareProvider` interface in `src/providers` once you have access to a compliant partner or B2B bus booking API.

Avoid broad scraping for public launch unless legal and platform terms have been reviewed.
