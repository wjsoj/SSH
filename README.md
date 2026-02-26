# SSH - Scientific Skills Hub

[![CI](https://github.com/wjsoj/ssh/actions/workflows/build.yml/badge.svg)](https://github.com/wjsoj/ssh/actions/workflows/build.yml)
[![Security](https://github.com/wjsoj/ssh/actions/workflows/security.yml/badge.svg)](https://github.com/wjsoj/ssh/actions/workflows/security.yml)
[![Docker](https://img.shields.io/docker/pulls/wjsoj/ssh.svg)](https://hub.docker.com/r/wjsoj/ssh)
[![License](https://img.shields.io/github/license/wjsoj/ssh.svg)](https://github.com/wjsoj/ssh/blob/main/LICENSE)
[![Bun](https://img.shields.io/badge/Bun-1.x+-FBFBF8.svg)](https://bun.sh)

A platform for discovering and sharing research skills for scientific discovery. Built with Next.js, TypeScript, and shadcn/ui.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Contributing](#contributing)
- [License](#license)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Database**: Prisma ORM + SQLite (development) / PostgreSQL (production)
- **Authentication**: NextAuth.js + GitHub OAuth
- **Code Quality**: Biome
- **Testing**: Vitest + React Testing Library
- **Package Manager**: Bun

## Features

- Browse and search skills from GitHub repositories
- GitHub OAuth authentication
- Comment and review skills
- Admin dashboard for managing repositories
- Automated sync from GitHub repositories
- Docker support for deployment

## Getting Started

### Prerequisites

- Bun 1.x
- Node.js 20+
- Docker (optional, for containerized deployment)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ssh
```

2. Install dependencies:

```bash
bun install
```

3. Copy the environment file:

```bash
cp .env.example .env
```

4. Generate Prisma Client:

```bash
bun run prisma:generate
```

5. Push database schema:

```bash
bun run prisma:push
```

6. Start the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Yes |
| `NEXTAUTH_URL` | Base URL for the application | Yes |
| `GITHUB_ID` | GitHub OAuth App Client ID | Yes |
| `GITHUB_SECRET` | GitHub OAuth App Client Secret | Yes |
| `GITHUB_TOKEN` | GitHub Personal Access Token (optional, for higher API rate limits) | No |
| `CRON_SECRET` | Secret for cron job authentication | No |

## Cron Job Configuration

### Vercel (Recommended for Vercel deployment)

The `vercel.json` file configures automatic daily sync. Make sure to set `CRON_SECRET` in your environment variables.

### Self-hosted

For self-hosted deployments, you can use:

- **Systemd timers**: See `docs/cron/systemd/` for configuration
- **Crontab**: See `docs/cron/crontab.example` for examples

Example crontab entry:
```bash
0 2 * * * curl -X POST https://your-domain.com/api/cron/sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

## Docker Deployment

### Using Docker Compose

1. Build and start the containers:

```bash
docker-compose up -d
```

2. View logs:

```bash
docker-compose logs -f
```

3. Stop the containers:

```bash
docker-compose down
```

### Using Docker

1. Build the image:

```bash
docker build -t wjsoj/ssh .
```

2. Run the container:

```bash
docker run -p 3000:3000 --env-file .env wjsoj/ssh
```

### Using GHCR (GitHub Container Registry)

```bash
docker pull ghcr.io/wjsoj/ssh:latest
docker run -p 3000:3000 --env-file .env ghcr.io/wjsoj/ssh:latest
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard pages
│   └── [owner]/           # Dynamic routes for skills
├── components/            # React components
│   └── ui/                # shadcn/ui components
└── lib/                   # Utility libraries
    ├── prisma.ts          # Prisma client
    ├── auth.ts            # NextAuth configuration
    └── github-sync.ts     # GitHub sync utilities
prisma/
├── schema.prisma          # Database schema
└── dev.db                # SQLite database (development)
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run Biome linter |
| `bun run format` | Format code with Biome |
| `bun run typecheck` | Run TypeScript type check |
| `bun run test` | Run tests in watch mode |
| `bun run test:run` | Run tests once |
| `bun run test:coverage` | Run tests with coverage |
| `bun run prisma:generate` | Generate Prisma Client |
| `bun run prisma:push` | Push schema to database |
| `bun run prisma:studio` | Open Prisma Studio |
| `bun run docker:build` | Build Docker image |
| `bun run docker:up` | Start Docker containers |
| `bun run docker:down` | Stop Docker containers |

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT
