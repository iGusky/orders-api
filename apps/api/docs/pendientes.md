# Pendientes

Puntos que quedaron abiertos en las revisiones de código. Marca cada uno con `[x]` cuando lo resuelvas.
Las referencias (D*n*, I*n*) apuntan a [`modelo-de-datos.md`](modelo-de-datos.md). Los temas para estudiar están en [`temas-a-investigar.md`](temas-a-investigar.md).

*Última revisión:* 2026-10-30

---

## Antes de la fase 2

Hallazgos al revisar el código para la [fase 2](modelo-de-datos.md#8-fase-2-tiendas-y-cuentas-de-google). También sigue abierto "Leer, verificar y escribir no es seguro con peticiones simultáneas", más abajo.

- [ ] **Validar los renglones de `POST /movements`.**
  Ver "Discrepancias conocidas" en [`../../web/docs/api.md`](../../web/docs/api.md). Al activar la validación anidada, revisar también `lineTotalCents` para no rechazar el `0` que exige I7.

- [ ] **Sustituir `origin: "*"` en el CORS.**
  No es compatible con cookies o credenciales (D22).

## Fase 2: migración `add_user_store_and_sessions_table`

Revisión del 2026-11-04.

- [ ] **Índice por `storeId` en `Movement`.**
  `Product` ya tiene `@@index([storeId])`; `Movement` no, y PostgreSQL no crea índices para las FK. D17 propone uno compuesto que empiece por `storeId`: elegir la segunda columna según el `orderBy` de `GET /movements`.

- [ ] **Índices en las FK de `MovementItem` (`movementId`, `productId`).**
  Revisar qué consultas los usan (detalle de un movimiento, historial de un producto).

- [ ] **Quitar `OAUTH_CLIENT_SECRET` del `.env` de la API.**
  D23 no lo usa. Un secreto que no se necesita solo es superficie de riesgo.

## Fase 2: `POST /auth/google` (después del *happy path*)

Revisión del 2026-11-09. Se dejan para después de terminar el flujo completo.

- [ ] **Errores en lugar de `return false`.** Token inválido, `payload` nulo o datos faltantes deben lanzar un error de dominio que el filter traduzca a 401 (`verifyIdToken` además lanza su propia excepción).
- [ ] **Usar `GoogleTokenVerifier`** en lugar de `new OAuth2Client()` en el módulo de `auth.service.ts`, y `ConfigService` en lugar de `process.env.OAUTH_CLIENT_ID`.
- [ ] **Usuario existente: refrescar `email`, `name` y `avatarUrl`** (8.3: "se refresca al entrar"). Hoy solo se actualizan al crear.
- [ ] **"Buscar o crear" con peticiones simultáneas.** `findUnique` + `create` puede chocar con el `UNIQUE` de `googleSub` (I15). Ver el tema en `temas-a-investigar.md`.
- [ ] **Usuario con borrado lógico.** `findUserByGsub` filtra `deletedAt: null`; si no lo encuentra, `create` falla por el `UNIQUE` de `googleSub`. Depende de P15.
- [ ] **Quitar `txHost` de `AuthService`** si no se usa, y los imports sin uso de `users.service.ts`.
- [ ] **Instalar y registrar `cookie-parser`** antes de leer la cookie (logout y guard).

## `MovementItemService` y `MovementsService`

- [ ] **Validar el stock antes de escribir.**
  En `createAndAppendItem`, `prisma.movementItem.create` corre antes de revisar el stock. Si no hay stock, el item ya quedó guardado. `ProductNotFoundError` ya está en el lugar correcto: tomarlo como referencia.

- [ ] **Un error a mitad del movimiento deja datos parciales.**
  `createMovement` crea el `Movement` y luego los items uno por uno. Si el item 3 falla, el movimiento y los items 1 y 2 quedan guardados. El `try { } catch(e) { throw(e) }` no hace nada. Relacionado con D2, I3 y los temas de transacciones.

- [ ] **Leer, verificar y escribir no es seguro con peticiones simultáneas.**
  Dos ventas al mismo tiempo pueden pasar la validación de stock. Relacionado con I2.

- [ ] **Quitar los imports sin uso de `movementItems.service.ts`.**
  `HttpException` y `HttpStatus` ya no se usan, y sugieren que el service conoce HTTP.

## Decisiones por registrar en `modelo-de-datos.md`

- [ ] **Enum central de códigos + `abstract readonly code`.**
  El enum es el catálogo y el miembro abstracto obliga a cada subclase a elegir uno. Costo: `common` cambia cada vez que un módulo agrega un error (abierto/cerrado). Cuándo reconsiderarlo: muchos módulos (alternativa: un enum por módulo y una unión de tipos).

- [ ] **`InsufficientStockError` vive en `movements`.**
  Motivo: la regla se valida al registrar un movimiento, aunque el stock sea un atributo de `Product`.

- [ ] **La traducción `code` → status HTTP vive en el filter, no en las clases de error.**
  El dominio no conoce HTTP. Cuándo reconsiderarlo: si la tabla crece mucho, mapear por categoría semántica (`NotFound`, `Conflict`, `RuleViolation`) en lugar de por código.
