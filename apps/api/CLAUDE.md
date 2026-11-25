# Claude: backend (`apps/api`)

Desde 2026-11-24 **Claude también escribe el backend**: módulos, controllers, services, DTOs, guards, migraciones y
pruebas. El usuario ya conoce NestJS; lee el código que se genera y pregunta lo que no entienda. El objetivo es
avanzar más rápido **sin cambiar la arquitectura** descrita abajo. Si algo de la arquitectura no alcanza para una
tarea, propón el cambio y pregunta antes de introducirlo.

## Acerca del proyecto
Software para gestionar el inventario de productos de un negocio pequeño e informal que vende en bazares: registrar
ventas (salidas), reabastecimientos y otros movimientos de stock. El registro es manual; el usuario piensa en términos
como "acabo de vender un paquete de 5 stickers en 45 pesos" y hay que restar 5 stickers al inventario.

- Es **solo una API REST** que recibe **JSON estructurado**. El frontend (`apps/web`) facilita la captura.
- La API **no interpreta texto en lenguaje natural**.
- Aunque hoy lo usen pocas personas, se diseña como si fuera para cientos de miles: aislamiento entre tiendas,
  concurrencia en el stock y seguridad no son opcionales.

## Fuentes de verdad
- **`docs/modelo-de-datos.md`**: modelo, decisiones (D*n*), invariantes (I*n*) y requerimientos. Si el código y el
  documento no coinciden, uno de los dos está mal: corrígelo en el mismo cambio. Al implementar una sección marcada
  como "diseño, sin implementar", muévela a su lugar o actualiza su estado.
- **`../web/docs/api.md`**: contrato para el frontend. Todo cambio en un endpoint (ruta, DTO, respuesta, `errorCode`)
  actualiza ese archivo y los tipos de `apps/web/src/types` en el mismo cambio.
- `docs/pendientes.md`: deuda conocida.

## Arquitectura (síguela)

```
src/
  main.ts                  # ValidationPipe global (transform), CORS por CORS_ORIGIN, cookie-parser
  app.module.ts            # Módulos, DomainErrorFilter (APP_FILTER), AuthGuard (APP_GUARD), ClsModule transaccional
  common/
    constants/             # Constantes compartidas (MAX_POSTGRES_POSITIVE_INTEGER, SESSION_DAYS_LIMIT…)
    decorators/            # @Public(), @User(), @Store(): leen lo que dejó el guard en el request
    exceptions/            # DomainError (abstracta) y DomainErrorCode (enum con los errorCode públicos)
    filters/               # DomainErrorFilter: errorCode → status HTTP (tabla domainErrorToHttpCode)
    guards/auth.guard.ts   # Global: sesión por cookie, carga usuario y tienda en el request
    types/express.d.ts     # UserInfo, StoreInfo y la extensión de Express.Request
  modules/<recurso>/
    <recurso>.module.ts
    <recurso>.controller.ts  # Delgado: recibe DTO + @User()/@Store(), llama al service, devuelve su resultado
    <recurso>.service.ts     # Lógica de negocio y acceso a datos con Prisma
    dto/                     # Clases con class-validator (body y query)
    exceptions/              # Una clase por error de dominio, extiende DomainError
  prisma/                  # PrismaModule y PrismaService
prisma/
  schema.prisma            # generator + datasource
  models/*.prisma          # Un archivo por agregado (users, stores, products, movments, sessions)
  migrations/              # Generadas con prisma migrate
```

Reglas:
- **Errores de negocio:** clase en `modules/<recurso>/exceptions/` que extiende `DomainError`, con `readonly code`
  nuevo en `DomainErrorCode` y su status en `domainErrorToHttpCode`. Nunca `HttpException` para reglas de negocio. El
  `message` es en español; el frontend decide con `errorCode`.
- **Autenticación por defecto** (D21): el `AuthGuard` es global; un endpoint público lleva `@Public()`.
- **Tienda:** sale del guard (`@Store()`), nunca del body, query ni URL (D18). Toda consulta filtra por `storeId` (I13);
  un recurso de otra tienda responde 404 (D19).
- **Transacciones:** `@Transactional()` de `@nestjs-cls/transactional` en el método del service, y
  `this.txHost.tx.<modelo>` dentro de él para que todo comparta la transacción. Los cambios de stock respetan I2
  (sin stock negativo con peticiones simultáneas) y el orden de bloqueo por `productId`.
- **Dinero** en centavos enteros (D4, D15). **IDs** UUID v7 de la base (D13). **Borrado lógico** con `deletedAt`
  salvo las excepciones de D7, D11 y D24.
- **DTOs:** class-validator explícito (tipo, límites, opcionales). Sin `storeId` ni campos que ponga el servidor.
- **Imports** ESM con extensión `.js` (el paquete es `"type": "module"`). Tipos de Prisma desde `generated/prisma`.
- No agregues dependencias nuevas sin preguntar.

## Idioma
- Código (clases, propiedades, enums, rutas, tablas, commits) en **inglés**.
- Documentación (`README.md`, `docs/`), mensajes de error y explicaciones en **español**.

## Flujo de trabajo
- Antes de implementar algo que no esté en `docs/modelo-de-datos.md`, documenta la decisión ahí (o pregunta si es
  del usuario). Al terminar, actualiza el documento y `apps/web/docs/api.md`.
- Al terminar una tarea, resume **qué** cambió y **por qué** en las partes no obvias (concurrencia, seguridad,
  decisiones de Prisma o de NestJS), para que el usuario pueda revisarlo. Cuando pregunte por una implementación,
  explícala como tutor: el concepto, la alternativa y por qué se eligió esta.
- **Migraciones:** créalas con `prisma:migrate:create`, revisa el SQL generado (datos existentes, `NOT NULL`,
  índices) y aplícalas solo a la base de desarrollo. Nunca ejecutes nada contra producción.
- Agrega o actualiza pruebas para las invariantes que toque el cambio (sobre todo I2, I13 y permisos).
- Antes de dar una tarea por terminada, corre a través de Nx: `pnpm nx typecheck orders-api`,
  `pnpm nx run orders-api:eslint:lint` y `pnpm nx test orders-api`.

### Temas a investigar
- Cuando una implementación use un concepto que valga la pena estudiar a fondo, agrégalo a
  `docs/temas-a-investigar.md` como pendiente (`- [ ]`), en su sección, con la pregunta concreta, para qué sirve en el
  proyecto (con referencia a D*n*/I*n* si aplica) y la fecha. Revisa antes que no exista.
- **Nunca marques un tema como completado**: eso lo hace el usuario.

## Comandos

```sh
pnpm nx start:dev orders-api            # API en el puerto 3000
pnpm nx typecheck orders-api
pnpm nx run orders-api:eslint:lint
pnpm nx test orders-api
pnpm nx prisma:migrate:create orders-api -- --name <nombre>
pnpm nx prisma:migrate:dev orders-api
pnpm nx prisma:generate orders-api
```
