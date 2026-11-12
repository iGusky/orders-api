# syntax=docker/dockerfile:1
# Imagen de la API (NestJS + Prisma 7). Se construye desde la raíz del monorepo:
#   docker build -f apps/api/Dockerfile -t orders-api .
FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NX_DAEMON=false NX_NO_CLOUD=true
RUN corepack enable
WORKDIR /repo

# ---- Dependencias (capa cacheable: solo cambia con manifiestos o lockfile) ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter orders-api... --filter .

# ---- Build: prisma generate + nest build, y node_modules solo de producción ----
FROM deps AS build
COPY nx.json tsconfig.base.json tsconfig.json eslint.config.mjs ./
COPY apps/api apps/api
RUN pnpm nx build orders-api
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter orders-api deploy --prod --legacy /out

# ---- Runtime ----
FROM node:24-bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /out/package.json ./package.json
COPY --from=build --chown=node:node /repo/apps/api/dist ./dist
COPY --chown=node:node apps/api/prisma ./prisma
COPY --chown=node:node apps/api/prisma.config.ts ./prisma.config.ts
COPY --chown=node:node --chmod=755 apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
USER node
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
