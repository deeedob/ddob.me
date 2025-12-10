FROM node:20-alpine AS frontend
WORKDIR /src
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM ghcr.io/getzola/zola:v0.21.0 AS zola
WORKDIR /project
COPY --from=frontend /src /project
RUN ["zola", "build"]

FROM caddy:2-alpine
WORKDIR /srv
COPY --from=zola /project/public /srv
COPY docker/Caddyfile /etc/caddy/Caddyfile

# Caddy image runs as non-root; expose ports for http+https
EXPOSE 80 443
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
