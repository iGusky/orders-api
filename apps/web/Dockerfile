# syntax=docker/dockerfile:1
# Imagen del frontend (React + Vite servido con nginx). Se construye desde la raíz del monorepo:
#   docker build -f apps/web/Dockerfile \
#     --build-arg VITE_API_URL=https://apibazar.gushm.dev \
#     --build-arg VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com \
#     -t orders-web .
FROM node:24-bookworm-slim AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NX_DAEMON=false NX_NO_CLOUD=true
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter web... --filter .

COPY nx.json tsconfig.base.json tsconfig.json eslint.config.mjs ./
COPY apps/web apps/web

# Vite incrusta las variables VITE_* en el JS al compilar: cambiar su valor exige reconstruir la imagen.
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN test -n "$VITE_API_URL" || (echo "Falta el build-arg VITE_API_URL" && exit 1)
RUN pnpm nx build web

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
