# Contrato de la API (para el frontend)

> Resumen de lo que expone `apps/api`, escrito para quien construye el frontend.
> **La fuente de verdad es el código de la API** (controllers y DTOs en `apps/api/src/modules/*`)
> y el diseño en [`apps/api/docs/modelo-de-datos.md`](../../api/docs/modelo-de-datos.md).
> Si este documento y el código no coinciden, gana el código: actualiza este archivo.

Última revisión contra el código: 2026-11-02

---

## Generalidades

- **Base URL:** `import.meta.env.VITE_API_URL` (definida en `apps/web/.env`). La API escucha en el puerto `3000` por defecto.
- **Formato:** JSON en request y response. Hoy la API no exige sesión y su CORS está abierto (`*`); ver
  "Sesión (fase 2)" más abajo para lo que el frontend ya espera.
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
| GET    | `/movements`      | `getMovements(params)`       | Lista paginada de movimientos con renglones  |
| POST   | `/movements`      | `createMovement(input)`      | Registra un movimiento y ajusta el stock    |

No existen (todavía): editar o borrar productos, detalle de un movimiento, reportes. `OrdersController` existe en el código pero **no está registrado** en `AppModule`: `/orders` responde 404.

---

## Sesión (fase 2): en construcción en la API

> El frontend ya usa este contrato (`src/services/api/auth.ts`, `src/types/auth.ts`, `src/auth/`).
> Estado en la API (2026-11-09): `POST /auth/google` existe (happy path, sin manejo de errores todavía) y
> `GET /me` existe (`MeController`, en `modules/users`). `/auth/logout` aún responde 404, así que "Cerrar sesión"
> muestra "No se pudo cerrar sesión".
> Diseño en D20 a D24 de [`modelo-de-datos.md`](../../api/docs/modelo-de-datos.md#8-fase-2-tiendas-y-cuentas-de-google).
> Cuando la API termine cada endpoint, verifica contra el controller y mueve su fila a la tabla de arriba.

| Método | Ruta            | Función del cliente          | Estado en la API | Descripción                                          |
|--------|-----------------|------------------------------|------------------|------------------------------------------------------|
| POST   | `/auth/google`  | `loginWithGoogle({ credential })` | Existe      | Verifica el ID token de Google, pone la cookie de sesión y responde **204** sin body |
| POST   | `/auth/logout`  | `logout()`                   | Pendiente        | Revoca la sesión y borra la cookie                   |
| GET    | `/me`           | `getMe()`                    | Existe           | Persona de la sesión y su tienda; **401** sin sesión |

- **Cookie que pone `POST /auth/google`** (`AuthController`): nombre `session`, `HttpOnly`, `Secure`,
  `SameSite=Strict` y `Expires` igual a la expiración de la sesión en la base (hoy 1 día, provisional: P16). Sin `Domain`,
  así que solo la recibe el host de la API.

- **Cookie de sesión `httpOnly`** (D22): la pone la API; el frontend nunca la lee ni guarda tokens. Todas las peticiones
  van con `withCredentials: true` (en `http.ts`).
- **CORS**: con credenciales el navegador rechaza `Access-Control-Allow-Origin: *`. La API ya permite solo
  `http://localhost:4200` con `credentials: true` (`main.ts`). Con `pnpm dev:lan` (`VITE_API_URL=/api`) las
  peticiones pasan por el proxy de Vite y son del mismo origen, así que no aplica.
- **401 en cualquier endpoint** = sesión vencida o revocada: el frontend manda a `/iniciar-sesion` y después regresa
  a la pantalla pedida.
- `POST /auth/google` responde `204` sin body: el frontend llama después a `GET /me` (decisión en la tabla 8.6 de
  `modelo-de-datos.md`). Si la credencial no es válida, se espera **401** (la API todavía no maneja ese error).

`POST /auth/google`, body (`GoogleLoginInput`, igual que `GoogleLoginDto` de la API):

```json
{ "credential": "<ID token (JWT) del botón de Google Identity Services>" }
```

`GET /me`, respuesta (`CurrentUser`). Lee la cookie `session`; sin cookie o con una sesión inválida responde **401**
(`"Sesión no encontrada"`):

```json
{
  "id": "01a2...",
  "name": "Persona",
  "email": "persona@gmail.com",
  "avatarUrl": "https://lh3.googleusercontent.com/...",
  "store": {
    "id": "01a3...",
    "ownerId": "01a2...",
    "name": "Stickers del bazar",
    "address": "Bazar de la colonia, puesto 12",
    "phone": "+52 55 1234 5678",
    "description": null,
    "contactEmail": null,
    "createdAt": "2026-11-09T18:00:00.000Z",
    "deletedAt": null
  }
}
```

`store` trae todas las columnas de `Store` (tipo `Store` en `src/types/auth.ts`), y es `null` si la persona aún no
registra su tienda (D16). El frontend todavía no hace nada con eso; en la etapa 3
servirá para mandar al alta de tienda.

Configuración: `VITE_GOOGLE_CLIENT_ID` en `apps/web/.env` (público; es el mismo Client ID que la API usa para validar `aud`, D23).

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

| `errorCode`          | Status | Cuándo                                      |
|----------------------|--------|---------------------------------------------|
| `PRODUCT_NOT_FOUND`  | 404    | El producto no existe o está borrado        |
| `INSUFFICIENT_STOCK` | 409    | Una salida pide más unidades de las que hay |

**Error de validación** (`ValidationPipe` de NestJS), `message` es un arreglo:

```json
{ "statusCode": 400, "message": ["perPage must not be greater than 500"], "error": "Bad Request" }
```

**Cualquier otro error:** `500` genérico `{ "statusCode": 500, "message": "Internal server error" }`.

---

## Discrepancias conocidas entre el código y el diseño

El backend lo desarrolla el usuario a mano (ver `apps/api/CLAUDE.md`). **No modifiques `apps/api` desde el frontend**
ni "compenses" estos comportamientos en la UI sin preguntar; repórtalos.

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
