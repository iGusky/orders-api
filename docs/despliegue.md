# Despliegue

Cómo se construyen y despliegan `apps/api` (`orders-api`) y `apps/web` (`web`) en un servidor ARM con Dokploy.

## Arquitectura

```
Navegador
   │  HTTPS
   ▼
Traefik (Dokploy, certificados Let's Encrypt)
   ├── bazar.gushm.dev     → contenedor web  (nginx, puerto 80)  → archivos estáticos de Vite
   └── apibazar.gushm.dev  → contenedor api  (Node, puerto 3000) ──► Postgres (orders-db, red interna)
```

- Una imagen por app, `linux/arm64`, publicada en GitHub Container Registry (GHCR):
  - `ghcr.io/igusky/orders-api-api` (tags `latest` y `sha-<commit>`)
  - `ghcr.io/igusky/orders-api-web` (tags `latest` y `sha-<commit>`)
- La cookie `session` (`secure`, `sameSite: strict`) funciona entre `bazar.gushm.dev` y `apibazar.gushm.dev`
  porque ambos son el mismo *sitio* (`gushm.dev`). La API la emite sin `domain`, así que solo la recibe `apibazar.gushm.dev`.
- Las migraciones se aplican al arrancar el contenedor de la API (`apps/api/docker-entrypoint.sh` corre
  `prisma migrate deploy` y luego `node dist/src/main.js`). Si una migración falla, el contenedor termina con error y
  la API queda caída hasta corregirla: revisa los logs después de cada despliegue que incluya migraciones.

## Flujo de ramas y CI

1. Se trabaja en `dev`. Los pushes a `dev` **no** construyen nada.
2. Se abre un PR `dev → main`. Al fusionarlo (push a `main`):
   - `.github/workflows/api-image.yml` corre si cambió `apps/api/**` o la configuración compartida
     (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `nx.json`, `tsconfig*.json`, `.dockerignore`).
   - `.github/workflows/web-image.yml` igual, con `apps/web/**`.
3. Cada workflow construye la imagen en un runner ARM (`ubuntu-24.04-arm`), la sube a GHCR y llama al *webhook*
   de Dokploy para que descargue `latest` y redespliegue.
4. Para forzar un build sin cambios: pestaña **Actions → `<app>-image` → Run workflow** (rama `main`).

Recomendado: en GitHub, **Settings → Branches → Add rule** para `main`: exigir PR y bloquear pushes directos.

## Variables de entorno: qué va dónde

| Variable | App | Dónde se define | Se usa en | Ejemplo |
|---|---|---|---|---|
| `DATABASE_URL` | api | Dokploy → app `api` → **Environment** | Ejecución | `postgresql://orders:***@<host-interno>:5432/orders` |
| `OAUTH_CLIENT_ID` | api | Dokploy → app `api` → **Environment** | Ejecución | Client ID de Google |
| `CORS_ORIGIN` | api | Dokploy → app `api` → **Environment** | Ejecución | `https://bazar.gushm.dev` |
| `PORT` | api | Dokploy (opcional; la imagen usa `3000`) | Ejecución | `3000` |
| `NODE_ENV` | api | Ya viene en la imagen (`production`) | Ejecución | — |
| `VITE_API_URL` | web | GitHub → **Settings → Secrets and variables → Actions → Variables** | Compilación | `https://apibazar.gushm.dev` |
| `VITE_GOOGLE_CLIENT_ID` | web | GitHub → … → Actions → **Variables** (es público) | Compilación | Client ID de Google |
| `DOKPLOY_DEPLOY_WEBHOOK_API` | CI | GitHub → … → Actions → **Secrets** | CI | Webhook de la app `api` en Dokploy |
| `DOKPLOY_DEPLOY_WEBHOOK_WEB` | CI | GitHub → … → Actions → **Secrets** | CI | Webhook de la app `web` en Dokploy |
| `GITHUB_TOKEN` | CI | Automático, no se crea | CI | — |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | db | Dokploy → base `orders-db`, al crearla | Ejecución | `orders` / `orders` / *(generada)* |

Importante:
- Las variables `VITE_*` **no sirven en Dokploy**: Vite las incrusta en el JavaScript al compilar. Si cambian, hay que
  volver a correr `web-image` (Run workflow).
- `OAUTH_CLIENT_SECRET` hoy no se usa en el código (la API solo valida el `audience` del ID token); no se configura en producción.
- Para desarrollo local, copia `apps/api/.env.example` → `apps/api/.env` y `apps/web/.env.example` → `apps/web/.env`.

## Puesta en marcha (una sola vez)

### 1. DNS

En el proveedor de `gushm.dev`, crea registros `A` (y `AAAA` si el servidor tiene IPv6) hacia la IP del servidor:
- `bazar`
- `apibazar`

### 2. Google Cloud Console

En la credencial OAuth (tipo *Web application*) agrega `https://bazar.gushm.dev` a **Authorized JavaScript origins**.

### 3. Dokploy

1. **Settings → Registry** (solo si los paquetes de GHCR son privados): registro `ghcr.io`, usuario de GitHub y un
   *Personal Access Token (classic)* con permiso `read:packages`.
2. Crea un proyecto `bazar`.
3. **Database → PostgreSQL** (`orders-db`):
   - `POSTGRES_DB=orders`, `POSTGRES_USER=orders`, contraseña generada.
   - Sin puerto externo (solo red interna).
   - **Backups**: programa respaldos (diarios) a un destino S3 compatible.
   - Copia la **Internal Connection URL**: es el `DATABASE_URL` de la API.
4. **Application `api`**:
   - Source: **Docker** → `ghcr.io/igusky/orders-api-api:latest` (con el registro del paso 1 si es privado).
   - **Environment**: `DATABASE_URL`, `OAUTH_CLIENT_ID`, `CORS_ORIGIN=https://bazar.gushm.dev`.
   - **Domains**: `apibazar.gushm.dev`, container port `3000`, HTTPS con Let's Encrypt.
   - **Deployments → Webhook URL**: cópiala al secreto `DOKPLOY_DEPLOY_WEBHOOK_API` de GitHub.
5. **Application `web`**:
   - Source: **Docker** → `ghcr.io/igusky/orders-api-web:latest`.
   - **Domains**: `bazar.gushm.dev`, container port `80`, HTTPS con Let's Encrypt.
   - **Deployments → Webhook URL** → secreto `DOKPLOY_DEPLOY_WEBHOOK_WEB`.

### 4. GitHub

En **Settings → Secrets and variables → Actions**:
- **Variables**: `VITE_API_URL=https://apibazar.gushm.dev`, `VITE_GOOGLE_CLIENT_ID=<client id>`.
- **Secrets**: `DOKPLOY_DEPLOY_WEBHOOK_API`, `DOKPLOY_DEPLOY_WEBHOOK_WEB`.

Primer despliegue: corre **Run workflow** en `api-image` y luego en `web-image`. La API crea las tablas al arrancar.

## Prisma 7

La CLI (`prisma`), `@prisma/client` y `@prisma/adapter-pg` van en la misma versión (7.10.x). El cliente se genera en
`apps/api/generated/prisma` (ignorado por git); `build` lo genera antes de compilar.

| Comando (desde la raíz) | Para qué |
|---|---|
| `pnpm --filter orders-api prisma:generate` | Regenerar el cliente tras cambiar `prisma/models/*.prisma` |
| `pnpm --filter orders-api prisma:migrate:dev` | **Solo local**: crear y aplicar una migración a partir del schema |
| `pnpm --filter orders-api prisma:migrate:create` | Crear la migración sin aplicarla (para revisarla o editar el SQL) |
| `pnpm --filter orders-api prisma:migrate:status` | Ver qué migraciones faltan en la base apuntada por `DATABASE_URL` |
| `pnpm --filter orders-api prisma:migrate:deploy` | Aplicar migraciones pendientes (lo hace el contenedor al arrancar) |
| `pnpm --filter orders-api prisma:studio` | Explorar la base local |
| `pnpm nx build orders-api` | `prisma generate` + `nest build` |

Reglas:
- Nunca uses `migrate dev` ni `migrate reset` contra producción: pueden borrar datos.
- Las migraciones se versionan en `apps/api/prisma/migrations/` y llegan a producción con la imagen.
- Una migración ya aplicada no se edita: se crea otra.

## Operación

- **Redesplegar sin cambios de código**: Dokploy → app → **Deploy** (o Run workflow en GitHub si cambió una `VITE_*`).
- **Rollback**: en Dokploy cambia la imagen de `:latest` a `:sha-<commit anterior>` y despliega. Ojo: las migraciones no
  se revierten solas; si la versión nueva migró la base, revisa que la anterior siga siendo compatible.
- **Logs**: Dokploy → app → **Logs**. En la API, las primeras líneas muestran el resultado de `prisma migrate deploy`.
- **Respaldo manual**: Dokploy → `orders-db` → **Backups → Run now**.
- **Restaurar** (en el servidor): `docker exec -i <contenedor-postgres> pg_restore -U orders -d orders --clean < respaldo.dump`.

## Probar las imágenes en local

En una Mac con Apple Silicon (arm64, igual que el servidor):

```sh
docker build -f apps/api/Dockerfile -t orders-api:test .
docker build -f apps/web/Dockerfile \
  --build-arg VITE_API_URL=http://localhost:3000 \
  --build-arg VITE_GOOGLE_CLIENT_ID=<client id> \
  -t orders-web:test .
```

## Archivos involucrados

| Archivo | Qué hace |
|---|---|
| `apps/api/Dockerfile`, `apps/api/docker-entrypoint.sh` | Imagen de la API y arranque con migraciones |
| `apps/web/Dockerfile`, `apps/web/nginx.conf` | Imagen de la web, rutas SPA, caché y encabezados (COOP para Google) |
| `.dockerignore` | Excluye `node_modules`, `dist`, `.env`, etc. del contexto de build |
| `.github/workflows/api-image.yml`, `web-image.yml` | Build y publicación al fusionar en `main` |
| `apps/api/.env.example`, `apps/web/.env.example` | Variables necesarias para desarrollo local |
