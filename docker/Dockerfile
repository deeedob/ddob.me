# syntax=docker/dockerfile:1.4

# Stage 0: build frontend (npm)
FROM node:20-alpine AS frontend
WORKDIR /src
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 1: zola build
FROM ghcr.io/getzola/zola:v0.19.2 AS zola
WORKDIR /project
COPY --from=frontend /src /project
RUN ["zola", "build"]

# Stage 2: serve with Caddy (lets you add TLS and gRPC-Web proxying later)
FROM caddy:2-alpine
WORKDIR /srv
COPY --from=zola /project/public /srv
COPY docker/Caddyfile /etc/caddy/Caddyfile

# Caddy image runs as non-root; expose ports for http+https
EXPOSE 80 443
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
