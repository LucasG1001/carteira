# ---- build ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
# npm install (não `npm ci`): o projeto usa Vite 8/rolldown, cujos binários nativos
# e o fallback wasm (@emnapi/runtime) variam por plataforma. Um lock gerado no
# Windows não cobre os opcionais de Linux, então `npm ci` falha no build do container.
# `npm install` resolve a árvore real do Linux no momento do build.
RUN npm install --no-audit --no-fund

COPY . .

ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- serve (Caddy) ----
FROM caddy:2-alpine
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
