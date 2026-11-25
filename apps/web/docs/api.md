# Contrato de la API (para el frontend)

> Resumen de lo que expone `apps/api`, escrito para quien construye el frontend.
> **La fuente de verdad es el código de la API** (controllers y DTOs en `apps/api/src/modules/*`)
> y el diseño en [`apps/api/docs/modelo-de-datos.md`](../../api/docs/modelo-de-datos.md).
> Si este documento y el código no coinciden, gana el código: actualiza este archivo.

Última revisión contra el código: 2026-11-24

---

## Generalidades

- **Base URL:** `import.meta.env.VITE_API_URL` (definida en `apps/web/.env`). La API escucha en el puerto `3000` por defecto.
- **Formato:** JSON en request y response.
- **Sesión y tienda:** todo endpoint exige sesión (`AuthGuard` global; sin ella **401** `SESSION_NOT_FOUND`), salvo
  `POST /auth/google`. `/products`, `/movements`, `/members` e `/invitations` además exigen la tienda activa en el
  header `X-Store-Id` (ver "Empleados y tienda activa").
  Ver "Sesión (fase 2)" y "Errores".
- **IDs:** UUID v7 (`string`).
- **Fechas:** strings ISO 8601 en las respuestas (JSON no tiene tipo `Date`).
- **Dinero:** siempre **entero en centavos**, con sufijo `Cents`. La API nunca convierte a pesos;
  el frontend convierte al capturar (`"45.50"` → `4550`, redondeando al entero más cercano) y al mostrar (D4, D15).
- **Cliente HTTP:** usa las funciones de `src/services/api/*`; no llames a `axios` directamente desde páginas o componentes.

## Endpoints

| Método | Ruta              | Función del cliente          | Descripción                                 |
|--------|-------------------|------------------------------|---------------------------------------------|
| GET    | `/products`       | `getProducts(params)`        | Lista paginada de productos activos         |
| GET    | `/products/:id`   | `getProductById(id)`         | Un producto activo                          |
| POST   | `/products`       | `createProduct(input)`       | Alta de producto (stock inicial `0`)        |
| PATCH  | `/products/:id`   | `updateProduct(id, input)`   | Edita nombre, precio y descripción (dueño)  |
| GET    | `/movements`      | `getMovements(params)`       | Lista paginada de movimientos con renglones  |
| POST   | `/movements`      | `createMovement(input)`      | Registra un movimiento y ajusta el stock    |

Los seis trabajan solo con los datos de la tienda activa (`X-Store-Id`, D17, D28). Un producto de otra tienda responde
**404** `PRODUCT_NOT_FOUND`, igual que uno que no existe (D19).

No existen (todavía): borrar productos, detalle de un movimiento, reportes. `OrdersController` existe en el código pero **no está registrado** en `AppModule`: `/orders` responde 404.

---

## Sesión (fase 2): en construcción en la API

> El frontend ya usa este contrato (`src/services/api/auth.ts`, `src/types/auth.ts`, `src/auth/`).
> Estado en la API (2026-11-11): `POST /auth/google`, `GET /me` y `POST /stores` existen y responden errores de
> dominio. Estado 2026-11-24: `POST /auth/logout` existe.
> Diseño en D20 a D24 de [`modelo-de-datos.md`](../../api/docs/modelo-de-datos.md#8-fase-2-tiendas-y-cuentas-de-google).
> Cuando la API termine cada endpoint, verifica contra el controller y mueve su fila a la tabla de arriba.

| Método | Ruta            | Función del cliente          | Estado en la API | Descripción                                          |
|--------|-----------------|------------------------------|------------------|------------------------------------------------------|
| POST   | `/auth/google`  | `loginWithGoogle({ credential })` | Existe      | Verifica el ID token de Google, pone la cookie de sesión y responde **204** sin body. Público |
| POST   | `/auth/logout`  | `logout()`                   | Existe           | Revoca la sesión y borra la cookie; **204** sin body. Público e idempotente: sin cookie o con sesión vencida también responde 204 |
| GET    | `/me`           | `getMe()`                    | Existe           | Persona de la sesión y su tienda; **401** `SESSION_NOT_FOUND` sin sesión |
| POST   | `/stores`       | `createStore(input)`         | Existe           | Crea la tienda de la persona de la sesión; **409** `USER_HAS_STORE` si ya tiene una |

- **Cookie que pone `POST /auth/google`** (`AuthController`): nombre `session`, `HttpOnly`, `Secure`,
  `SameSite=Strict` y `Expires` igual a la expiración de la sesión en la base (hoy 1 día, provisional: P16). Sin `Domain`,
  así que solo la recibe el host de la API.

- **Cookie de sesión `httpOnly`** (D22): la pone la API; el frontend nunca la lee ni guarda tokens. Todas las peticiones
  van con `withCredentials: true` (en `http.ts`).
- **CORS**: con credenciales el navegador rechaza `Access-Control-Allow-Origin: *`. La API ya permite solo
  `http://localhost:4200` con `credentials: true` (`main.ts`). Con `pnpm dev:lan` (`VITE_API_URL=/api`) las
  peticiones pasan por el proxy de Vite y son del mismo origen, así que no aplica.
- **401 `SESSION_NOT_FOUND` en cualquier endpoint** (sin cookie, sesión vencida o revocada): `http.ts` avisa a
  `AuthProvider`, que manda a `/iniciar-sesion` y después regresa a la pantalla pedida. Si la persona ya estaba adentro,
  `/iniciar-sesion` le dice que su sesión terminó. Excepción: el 401 de `POST /auth/google` lo maneja la propia pantalla.
- `POST /auth/google` responde `204` sin body: el frontend llama después a `GET /me` (decisión en la tabla 8.6 de
  `modelo-de-datos.md`). Errores:

  | Respuesta                               | Cuándo                                                       | Qué muestra `/iniciar-sesion` |
  |-----------------------------------------|--------------------------------------------------------------|-------------------------------|
  | 401 `USER_INFO_NOT_FOUND_ON_GOOGLE`     | Cuenta nueva cuyo perfil de Google no trae nombre o correo   | Que los agregue en Google o entre con otra cuenta |
  | 401 `SESSION_NOT_FOUND`                 | Google validó el token pero no devolvió datos (`payload` vacío) | Que lo intente otra vez |
  | 500                                     | ID token inválido, vencido o de otra app (ver discrepancia 5) | Que el servidor tuvo un problema |
  | `204`, pero `GET /me` responde 401      | El navegador no guardó la cookie (CORS, `SameSite`, cookies bloqueadas) | Que revise si bloquea cookies |

`POST /auth/google`, body (`GoogleLoginInput`, igual que `GoogleLoginDto` de la API):

```json
{ "credential": "<ID token (JWT) del botón de Google Identity Services>" }
```

`GET /me`, respuesta (`CurrentUser`). Sin cookie o con una sesión inválida responde **401** `SESSION_NOT_FOUND`:

```json
{
  "id": "01a2...",
  "name": "Persona",
  "email": "persona@gmail.com",
  "avatarUrl": "https://lh3.googleusercontent.com/...",
  "stores": [
    {
      "id": "01a3...",
      "name": "Stickers del bazar",
      "address": "Bazar de la colonia, puesto 12",
      "phone": "+52 55 1234 5678",
      "description": null,
      "contactEmail": null,
      "role": "OWNER"
    },
    { "id": "01a4...", "name": "Tazas Lupita", "address": "...", "phone": "...", "description": null, "contactEmail": null, "role": "EMPLOYEE" }
  ]
}
```

`stores` son todas las tiendas activas de la persona, con su rol en cada una (D26): primero la propia, luego por
antigüedad. Cada una es `MemberStore` (`StoreInfo` + `role`, en `src/types/store.ts`, igual que en la API). Lista vacía si no
pertenece a ninguna: `<RequireStore>` manda a `/registrar-tienda`; con varias y ninguna elegida, a `/elegir-tienda`.

`POST /stores` (`StoresController`, detrás del `AuthGuard` global: **401** sin sesión). Body (`CreateStoreInput`,
igual que `CreateStoreDto`):

| Campo          | Tipo   | Requerido | Reglas en la API         |
|----------------|--------|-----------|--------------------------|
| `name`         | string | sí        | No vacío                 |
| `address`      | string | sí        | No vacío                 |
| `phone`        | string | sí        | No vacío (sin formato)   |
| `description`  | string | no        |                          |
| `contactEmail` | string | no        | Correo válido (`@IsEmail`) |

- Crea también la membresía `OWNER` del dueño, en la misma transacción (I17).
- Respuesta: la `Store` creada con todas sus columnas (`Store` en `src/types/store.ts`: `StoreInfo` más `ownerId`,
  `createdAt` y `deletedAt`).
- **409** `USER_HAS_STORE`: la persona ya tiene una tienda (I14), por ejemplo si la registró en otro dispositivo. El
  frontend vuelve a pedir `GET /me` y sigue con la tienda que ya existe.
- **400** si falla la validación del DTO.
- El formulario además pide al menos 8 dígitos en el teléfono; la API no lo valida.

Configuración: `VITE_GOOGLE_CLIENT_ID` en `apps/web/.env` (público; es el mismo Client ID que la API usa para validar `aud`, D23).

---

## Empleados y tienda activa (fase 3)

> Diseño en la sección 9 de [`modelo-de-datos.md`](../../api/docs/modelo-de-datos.md#9-fase-3-empleados-y-varias-tiendas-por-persona)
> (RF1 a RF9, D25 a D31). Estado (2026-11-24): **implementado en la API** (`AuthGuard`, `StoreRoleGuard`,
> `modules/members`). En el frontend falta que un empleado pueda salir de una tienda (RF5).

### Tienda activa: header `X-Store-Id` (D28)

- `http.ts` agrega `X-Store-Id: <id de la tienda activa>` a **todas** las peticiones cuando hay una tienda activa.
  Las pantallas no lo mandan a mano.
- La API busca la membresía `(storeId, userId)` y aplica el rol. Errores globales (`http.ts` → `AuthProvider`):

  | Respuesta                    | Cuándo                                                                 | Qué hace el frontend |
  |------------------------------|------------------------------------------------------------------------|----------------------|
  | 400 `STORE_NOT_SELECTED`     | Endpoint de tienda sin header                                          | Quita la tienda activa y manda a `/elegir-tienda` |
  | 404 `STORE_NOT_FOUND`        | El id no es una tienda de la que la persona sea miembro (o lo quitaron) | Igual, y avisa "Ya no tienes acceso a *tienda*" |

  Solo se reacciona si el error corresponde a la tienda que sigue activa: una respuesta tardía de una tienda anterior
  no borra la selección nueva.
- CORS: `X-Store-Id` provoca *preflight*. `enableCors` no define `allowedHeaders`, así que la API acepta los headers
  que pida el navegador; si algún día los define, debe incluir `X-Store-Id`.

`GET /me` devuelve `stores` (ver "Sesión (fase 2)" arriba).

### Permisos por rol (RF6, D30)

| Acción                                      | `OWNER` | `EMPLOYEE` | Error si no                |
|---------------------------------------------|:-------:|:----------:|----------------------------|
| `GET /products`, `GET /movements`           |   sí    |     sí     |                            |
| `POST /products`                            |   sí    |     sí     |                            |
| `PATCH /products/:id`                       |   sí    |   **no**   | 403 `ROLE_NOT_ALLOWED`     |
| `POST /movements` `SALE`, `RESTOCK`, `RETURN`, `SHRINKAGE` | sí | sí |                            |
| `POST /movements` `ADJUSTMENT`              |   sí    |   **no**   | 403 `ROLE_NOT_ALLOWED`     |
| Endpoints de equipo (abajo)                 |   sí    |     no     | 403 `ROLE_NOT_ALLOWED`     |

La UI oculta lo que el rol no permite (`useCurrentStore().role`), pero la regla la aplica la API.

### Equipo de la tienda activa (`MembersController`, `InvitationsController`)

Cliente: `getTeam`, `addMember`, `removeMember`, `revokeInvitation` en `src/services/api/members.ts`; tipos en
`src/types/member.ts`. Los usa `/equipo`, que solo ve el dueño.

| Método | Ruta                     | Descripción                                                                 |
|--------|--------------------------|-----------------------------------------------------------------------------|
| GET    | `/members`               | `{ members: StoreMember[], invitations: StoreInvitation[] }` (solo pendientes) |
| POST   | `/members`               | Body `{ "email": "ana@gmail.com" }`. **201** `{ "status": "ADDED", "member": … }` si ya tenía cuenta, o `{ "status": "INVITED", "invitation": … }` si no |
| DELETE | `/members/:userId`       | Quita a un empleado. **204**                                                |
| DELETE | `/invitations/:id`       | Cancela una invitación pendiente. **204**                                   |
| DELETE | `/members/me`            | La persona sale de la tienda (RF5); cualquier rol. El dueño recibe **409** `CANNOT_REMOVE_OWNER`. **204** |

```json
// StoreMember
{ "userId": "01a5...", "name": "Ana", "email": "ana@gmail.com", "avatarUrl": null, "role": "EMPLOYEE", "createdAt": "2026-11-23T18:00:00.000Z" }
// StoreInvitation
{ "id": "01a6...", "email": "luis@gmail.com", "createdAt": "2026-11-23T18:00:00.000Z" }
```

Errores propios:

| `errorCode`                  | Status | Cuándo                                                        |
|------------------------------|--------|---------------------------------------------------------------|
| `MEMBER_ALREADY_EXISTS`      | 409    | El correo es de alguien que ya es miembro (incluido el dueño) |
| `INVITATION_ALREADY_EXISTS`  | 409    | Ya hay una invitación pendiente con ese correo                |
| `MEMBER_NOT_FOUND`           | 404    | `DELETE /members/:userId` de alguien que no es miembro        |
| `INVITATION_NOT_FOUND`       | 404    | Invitación inexistente, ya aceptada o cancelada               |
| `CANNOT_REMOVE_OWNER`        | 409    | Intento de quitar al dueño (I17)                              |

### Autor de cada movimiento (D31)

`POST /movements` guarda `createdById` (la persona de la sesión; no va en el body) y `GET /movements` trae
`"createdBy": { "id": "01a5...", "name": "Ana" }` en cada movimiento. Los movimientos anteriores a la fase 3 se
atribuyeron al dueño de su tienda en la migración.

---

### Paginación (query params comunes)

Aplica a `GET /products` y `GET /movements`.

| Param     | Tipo    | Requerido | Reglas                         |
|-----------|---------|-----------|--------------------------------|
| `page`    | entero  | **sí**    | `>= 1`                         |
| `perPage` | entero  | **sí**    | `1..500`                       |
| `search`  | string  | no        | Ver cada endpoint              |

Si falta `page` o `perPage`, la API responde **400**. Siempre mándalos.

Respuesta (`Paginated<T>`, en `src/types/pagination.ts`):

```json
{ "page": 1, "perPage": 20, "totalItems": 42, "totalPages": 3, "data": [] }
```

---

### `GET /products`

- `search`: filtra por `name`, contiene, sin distinguir mayúsculas.
- Excluye productos borrados (`deletedAt != null`). Orden: más recientes primero (`id desc`).
- Respuesta: `Paginated<Product>`.

### `GET /products/:id`

- `id` debe ser UUID; si no, **400**.
- Si no existe o está borrado: **404** `PRODUCT_NOT_FOUND`.
- Respuesta: `Product`.

### `POST /products`

Body (`CreateProductInput`):

| Campo         | Tipo    | Requerido | Reglas                          |
|---------------|---------|-----------|---------------------------------|
| `name`        | string  | sí        | No vacío                        |
| `description` | string  | no        |                                 |
| `priceCents`  | entero  | sí        | `0..2147483647`                 |

- El stock **no** se manda: un producto nuevo nace con `stock: 0`. Para darle stock se registra un `RESTOCK`.
- Respuesta: `Product` creado.

### `PATCH /products/:id`

Solo el dueño (D32). Body (`UpdateProductInput`), todos opcionales; solo cambia lo que se manda:

| Campo         | Tipo           | Reglas                                   |
|---------------|----------------|------------------------------------------|
| `name`        | string         | No vacío; `null` no se acepta            |
| `description` | string \| null | `null` borra la descripción              |
| `priceCents`  | entero         | `0..2147483647`; `null` no se acepta     |

- El stock **no** se edita: si viene `stock` en el body, se ignora. Solo cambia con movimientos.
- `id` debe ser UUID; si no, **400**. Borrado o de otra tienda: **404** `PRODUCT_NOT_FOUND`. Empleado: **403** `ROLE_NOT_ALLOWED`.
- Respuesta: `Product` actualizado (con el `stock` actual).
- Efectos que la UI debe advertir antes de guardar:
  - **Nombre:** los movimientos guardan el `productId`, no el nombre. El nombre nuevo se ve en todo el historial de
    movimientos, en los selectores de producto y en el inventario.
  - **Precio:** no cambia ningún movimiento registrado (cada renglón tiene su `lineTotalCents`); solo se sugiere en
    ventas nuevas.

`Product`:

```json
{
  "id": "01a0f4c8-...",
  "name": "Sticker",
  "description": null,
  "priceCents": 900,
  "stock": 12,
  "createdAt": "2026-10-29T18:00:00.000Z",
  "deletedAt": null
}
```

---

### `GET /movements`

Filtros opcionales (`MovementFilters`, en `src/types/movement.ts`), además de `page` y `perPage`:

| Param       | Tipo                | Reglas                                                        |
|-------------|---------------------|---------------------------------------------------------------|
| `type`      | `MovementType`      | Uno de los cinco tipos                                        |
| `direction` | `MovementDirection` | Solo cuenta con `type=ADJUSTMENT`; con otro tipo se ignora    |
| `dateStart` | fecha ISO 8601      | `occurredAt >= dateStart`. Sin `dateEnd` responde **400**     |
| `dateEnd`   | fecha ISO 8601      | `occurredAt <= dateEnd`. Sin `dateStart` responde **400**     |

- Manda las fechas con hora completa (`toISOString()`): la pantalla usa las 00:00 del día de inicio y las
  23:59:59.999 del día de fin, en la hora del dispositivo.
- `search` ya no existe en este endpoint. Orden: más recientes primero (`id desc`).
- Respuesta: `Paginated<MovementWithItems>`: cada `Movement` con sus `items` y el nombre del producto de cada renglón.

`MovementItem`:

```json
{
  "id": "01a1...",
  "movementId": "01a1...",
  "productId": "01a0...",
  "quantity": 5,
  "lineTotalCents": 4500,
  "product": { "name": "Sticker" }
}
```

### `POST /movements`

Body (`CreateMovementInput`):

| Campo       | Tipo                        | Requerido               | Notas                                    |
|-------------|-----------------------------|-------------------------|------------------------------------------|
| `type`      | `MovementType`              | sí                      | `RESTOCK`, `SALE`, `RETURN`, `SHRINKAGE`, `ADJUSTMENT` |
| `direction` | `IN` \| `OUT`               | solo en `ADJUSTMENT`    | Omitir en los demás tipos (I9)           |
| `items`     | `CreateMovementItemInput[]` | sí, al menos uno        |                                          |
| `occurredAt` | string ISO 8601 con hora   | no                      | Si se omite, la API usa la fecha actual  |

`CreateMovementItemInput`:

| Campo            | Tipo   | Notas                                         |
|------------------|--------|-----------------------------------------------|
| `productId`      | UUID   | Producto activo                               |
| `quantity`       | entero | `1..2147483647`, siempre positivo; la dirección la da el tipo |
| `lineTotalCents` | entero | `0..2147483647`. Importe **total** del renglón, no unitario (D5) |

Cada renglón se valida: si uno no cumple, la API responde **400** con la ruta del campo en `message`
(`items.1.quantity must not be less than 1`).

Respuesta: el `Movement` creado (sin `items`):

```json
{
  "id": "01a1...",
  "type": "SALE",
  "direction": null,
  "occurredAt": "2026-10-29T18:00:00.000Z",
  "createdAt": "2026-10-29T18:05:00.000Z",
  "totalCents": 4500
}
```

Ejemplo — "vendí un paquete de 5 stickers en 45 pesos":

```json
{ "type": "SALE", "items": [{ "productId": "<sticker>", "quantity": 5, "lineTotalCents": 4500 }] }
```

Errores de dominio posibles: `PRODUCT_NOT_FOUND` (404), `INSUFFICIENT_STOCK` (409).

---

## Reglas de negocio que la UI debe reflejar

Efecto de cada tipo en el stock y significado de `lineTotalCents` (D3, D5):

| `type`       | Stock                      | `lineTotalCents`            | Texto sugerido en UI |
|--------------|----------------------------|-----------------------------|----------------------|
| `RESTOCK`    | suma                       | `0`                         | Reabastecimiento     |
| `SALE`       | resta                      | dinero cobrado              | Venta                |
| `RETURN`     | suma                       | dinero reembolsado          | Devolución           |
| `SHRINKAGE`  | resta                      | `0`                         | Merma                |
| `ADJUSTMENT` | según `direction` (`IN`/`OUT`) | `0`                     | Ajuste               |

- Los movimientos son **inmutables** (D11): la UI no ofrece editar ni borrar. Un error se corrige con un `ADJUSTMENT`.
- El precio unitario no se guarda; si se muestra, se calcula (`lineTotalCents / quantity`) solo para presentación.
- `priceCents` del producto es un precio de referencia: sirve para **sugerir** `lineTotalCents` en una venta
  (`priceCents * quantity`), pero el usuario puede cambiarlo (precios por paquete, descuentos).
- Los reportes por fecha se basan en `occurredAt`, no en `createdAt` (D8).

---

## Errores

Todas las respuestas de error tienen `statusCode` y `message`. Tipos en `src/types/api-error.ts`.

**Error de dominio** (lanzado por la API a propósito). Decide con `errorCode`, no con `message`:

```json
{ "statusCode": 409, "message": "No hay stock suficiente del producto: Sticker", "errorCode": "INSUFFICIENT_STOCK" }
```

| `errorCode`                     | Status | Cuándo                                                        | Quién lo maneja en el frontend |
|---------------------------------|--------|---------------------------------------------------------------|--------------------------------|
| `PRODUCT_NOT_FOUND`             | 404    | El producto no existe, está borrado o es de otra tienda (D19) | Cada pantalla que lo pide     |
| `INSUFFICIENT_STOCK`            | 409    | Una salida pide más unidades de las que hay                   | Venta y `/registrar-movimiento` |
| `SESSION_NOT_FOUND`             | 401    | Sin cookie, o la sesión venció o se revocó                    | `http.ts` → `AuthProvider` (global) |
| `USER_INFO_NOT_FOUND_ON_GOOGLE` | 401    | `POST /auth/google` con un perfil sin nombre o correo         | `/iniciar-sesion`             |
| `USER_HAS_STORE`                | 409    | `POST /stores` cuando la persona ya tiene tienda              | `/registrar-tienda`           |
| `STORE_NOT_SELECTED`            | 400    | Endpoint de tienda sin `X-Store-Id`                            | `http.ts` → `AuthProvider` (global) |
| `STORE_NOT_FOUND`               | 404    | `X-Store-Id` de una tienda a la que no pertenece (o borrada)  | `http.ts` → `AuthProvider` (global) |
| `ROLE_NOT_ALLOWED`              | 403    | Un empleado intenta un `ADJUSTMENT`, editar un producto o un endpoint de equipo | `/registrar-movimiento`, `/inventario` |

**Error de validación** (`ValidationPipe` de NestJS), `message` es un arreglo:

```json
{ "statusCode": 400, "message": ["perPage must not be greater than 500"], "error": "Bad Request" }
```

**Cualquier otro error:** `500` genérico `{ "statusCode": 500, "message": "Internal server error" }`.

**Sin respuesta** (sin internet o la API apagada): axios rechaza sin `response`.

`getRequestFailure(error)` (`services/api/errors.ts`) clasifica el fallo en `offline`, `server` (5xx), `rejected` (4xx)
o `unknown`, y `failedMessage('No se pudo …', error)` (`utils/requestErrors.ts`) agrega qué hacer: revisar la
conexión, o esperar porque el servidor tuvo un problema. Úsalo en vez de escribir "Revisa tu conexión" para todo.

---

## Discrepancias conocidas entre el código y el diseño

Pendientes de corregir en la API (ver `apps/api/CLAUDE.md`). No "compenses" estos comportamientos en la UI: corrígelos
en la API y quita la entrada de esta lista en el mismo cambio.

1. **`items` no se valida como arreglo con al menos un renglón:** falta `@IsArray` + `@ArrayNotEmpty` (`@IsNotEmpty` no
   rechaza `[]`). `items: []` pasa la validación y crea un movimiento sin renglones con `totalCents: 0`; un objeto suelto
   en lugar de un arreglo también pasa y truena en el servicio con **500**. No mandes el formulario sin renglones.
2. **`direction`** no se rechaza en tipos distintos de `ADJUSTMENT` por el DTO; la base de datos sí lo impide
   (check constraint) y respondería 500. No lo mandes fuera de `ADJUSTMENT`.
3. **I7 no se valida:** en `RESTOCK`, `SHRINKAGE` y `ADJUSTMENT` la API acepta `lineTotalCents > 0`. Lo guarda en el
   renglón, pero `totalCents` queda en `0`, lo que también rompe I3. Manda siempre `0` en esos tipos.
4. **Fechas sin hora completa:** `@IsISO8601` acepta `2026-10-26` y `2026-10-26T10:00:00` (sin zona horaria), pero
   Prisma solo acepta fecha y hora con zona, así que `GET /movements` responde 500 en lugar de 400. `occurredAt` en
   `POST /movements` pasa la misma validación. Manda siempre `toISOString()`.
5. **Un ID token inválido en `POST /auth/google` responde 500:** `verifyIdToken` lanza un `Error` común (firma,
   expiración o `aud` incorrectos) que no se convierte en error de dominio. El diseño espera **401**. El frontend lo
   muestra como problema del servidor. Propuesta: atrapar el error de `verifyIdToken` en `AuthService` y lanzar un
   error de dominio (por ejemplo `INVALID_GOOGLE_CREDENTIAL`, 401).
6. **`SESSION_NOT_FOUND` también se usa cuando Google no devuelve `payload`** en `POST /auth/google`. No es una sesión
   que falte, sino una credencial sin datos; un código propio permitiría un mensaje más preciso.
