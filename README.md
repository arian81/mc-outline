
## mc-outline

A small web app for McMaster students to upload, organize, and discover course outlines. Files are staged locally in your browser using OPFS while you add/edit metadata, then uploaded to a GitHub repository used as zero‑maintenance object storage. This keeps the service inexpensive to run and makes it possible to preserve files even if the site goes offline.

### Why this exists
McMaster doesn’t provide a public, centralized archive of course outlines. Students often share files in private spaces (e.g., Discord), which are not accessible or searchable. This app aims to make outlines easy to upload, browse, and download by course and semester.

### Key features
- **Local-first uploads (OPFS)**: Files and metadata are saved to the browser’s Origin Private File System during editing, surviving refreshes and avoiding small per-file limits common to localStorage/IndexedDB. Storage is still subject to browser quota.
- **GitHub as object storage**: Finalized files are committed via a GitHub App to a repository path structure `MAJOR/COURSE_CODE/SEMESTER/`. This removes ongoing infra cost and allows making the archive public if needed.
- **Typed end-to-end API**: Built with tRPC for safe, typed queries/mutations.
- **Modern UI**: Next.js App Router with Tailwind CSS and accessible UI primitives.

### Tech stack
- **App**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **API**: tRPC 11, superjson
- **State Management**: TanStack Query 5
- **Storage**: OPFS (browser), GitHub (Octokit via GitHub App)
- **Analytics**: PostHog
## Getting started

### Prerequisites
- Node.js >= 20
- pnpm (preferred)

### Install
```bash
pnpm install
```

### Environment variables
Create a `.env` file in the project root. These are validated via `@t3-oss/env-nextjs`.

```env
# GitHub App credentials (server-side)
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_APP_INSTALLATION_ID=

# The repo that stores uploaded files, e.g. "your-org/outline-archive"
GITHUB_OBJECT_STORAGE_REPO=

# PostHog (optional but recommended)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

#### Notes on GitHub setup
- Create a GitHub App with permissions to read/write repository contents.
- Install the app to the org/repo you’ll use for storage.
- Set `GITHUB_OBJECT_STORAGE_REPO` to `owner/repo` for that repository.

### Run
```bash
pnpm dev
```

Build and start a production server:
```bash
pnpm build
pnpm start
```

### Useful scripts
- **Type check**: `pnpm typecheck`
- **Lint / format (Biome)**: `pnpm check`, `pnpm lint`
- **Scrape course mapping**: `pnpm scrape`

## How it works

### Local staging with OPFS
- When you select a PDF, it and its metadata are written to OPFS. This allows you to edit metadata safely without losing work on refresh.
- OPFS supports large files compared to localStorage/IndexedDB but is limited by browser storage quotas.

### GitHub-backed storage
- On upload, the server uses a GitHub App (Octokit) to create or update file contents at:
  - `MAJOR/COURSE_CODE/SEMESTER/<file>.pdf`
  - `MAJOR/COURSE_CODE/SEMESTER/<file>.meta.json`
- Browsing queries GitHub for directory listings and pairs pdf/meta files. Downloads are served via an API route that proxies GitHub content.

## Architecture

```mermaid
graph LR
  subgraph "Browser (Client)"
    UI["Next.js UI (React 19)"] --> OPFS["OPFS: Local file + metadata staging"]
    UI --> TRPCClient["tRPC Client"]
    UI --> Download["Download: /api/files/download"]
  end

  subgraph "Server (Next.js)"
    TRPCClient --> Router["tRPC githubRouter (uploadFile, listFiles)"]
    Router --> Octokit["Octokit (GitHub App Installation)"]
    Download --> Proxy["API route: /api/files/download -> GitHub content"]
  end

  subgraph "GitHub"
    Repo(("Repo: GITHUB_OBJECT_STORAGE_REPO"))
    Paths["MAJOR/COURSE_CODE/SEMESTER/*.pdf + *.meta.json"]
  end

  Octokit --> Repo
  Proxy --> Repo
  Repo --> Paths
  ```


## Contributing
Issues and PRs are welcome. Keep code clear, minimal, and consistent with the existing style. Use pnpm, TypeScript, and Biome.

## Disclaimer
This project is not affiliated with McMaster University.
