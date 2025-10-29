# DDob.me

This repository contains the frontend code powering **[ddob.me](https://www.ddob.me)**.
The site is built with **Zola**, **TailwindCSS**, and **ESBuild** — and deployed via Docker.

## Development

Install dependencies:

```bash
npm run dev
```
Start development environment:

```bash
npm run dev
```

## Deployment

```bash
cd docker/
docker compose build --no-cache && docker compose up -d
```
