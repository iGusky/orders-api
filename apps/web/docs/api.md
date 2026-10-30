# Contrato de la API (para el frontend)

> Resumen de lo que expone `apps/api`, escrito para quien construye el frontend.
> **La fuente de verdad es el código de la API** (controllers y DTOs en `apps/api/src/modules/*`)
> y el diseño en [`apps/api/docs/modelo-de-datos.md`](../../api/docs/modelo-de-datos.md).
> Si este documento y el código no coinciden, gana el código: actualiza este archivo.

Última revisión contra el código: 2026-10-29

---

## Generalidades

- **Base URL:** `import.meta.env.VITE_API_URL` (definida en `apps/web/.env`). La API escucha en el puerto `3000` por defecto.
- **Formato:** JSON en request y response. Sin autenticación. CORS abierto (`*`).
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
| GET    | `/movements`      | `getMovements(params)`       | Lista paginada de movimientos (sin renglones) |
| POST   | `/movements`      | `createMovement(input)`      | Registra un movimiento y ajusta el stock    |

No existen (todavía): editar o borrar productos, detalle de un movimiento, consultar los renglones de un movimiento,
reportes. `OrdersController` existe en el código pero **no está registrado** en `AppModule`: `/orders` responde 404.

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

- `search` se acepta pero **se ignora** (no filtra nada).
- Orden: más recientes primero (`id desc`). No incluye `items`.
- Respuesta: `Paginated<Movement>`.

### `POST /movements`

Body (`CreateMovementInput`):

| Campo       | Tipo                        | Requerido               | Notas                                    |
|-------------|-----------------------------|-------------------------|------------------------------------------|
| `type`      | `MovementType`              | sí                      | `RESTOCK`, `SALE`, `RETURN`, `SHRINKAGE`, `ADJUSTMENT` |
| `direction` | `IN` \| `OUT`               | solo en `ADJUSTMENT`    | Omitir en los demás tipos (I9)           |
| `items`     | `CreateMovementItemInput[]` | sí, al menos uno        |                                          |
| `ocurredAt` | string ISO 8601             | no                      | **Ojo al nombre:** el request usa `ocurredAt` (una "c"), la respuesta usa `occurredAt`. Si se omite, la API usa la fecha actual |

`CreateMovementItemInput`:

| Campo            | Tipo   | Notas                                         |
|------------------|--------|-----------------------------------------------|
| `productId`      | UUID   | Producto activo                               |
| `quantity`       | entero | `> 0`, siempre positivo; la dirección la da el tipo |
| `lineTotalCents` | entero | Importe **total** del renglón, no unitario (D5) |

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

1. **`lineTotalCents` exige `> 0`** (`@IsPositive`), pero el diseño pide `0` en `RESTOCK`, `SHRINKAGE` y `ADJUSTMENT` (I7).
   Hoy esa validación **no se ejecuta** porque `items` no tiene `@ValidateNested`, así que `0` pasa. Si se corrige
   solo la validación anidada, los `RESTOCK` con `0` empezarán a fallar con 400.
2. **Los renglones no se validan** (falta `@ValidateNested` + `@Type`): `quantity`, `productId` y `lineTotalCents`
   pueden llegar con cualquier valor. La base de datos sí rechaza `quantity <= 0` y `lineTotalCents < 0`, pero
   responde **500**, no 400. Valida en el formulario antes de enviar.
3. **`RETURN` y `SHRINKAGE` no modifican el stock** todavía (solo `SALE`, `RESTOCK` y `ADJUSTMENT`).
4. **`totalCents` solo se calcula en `SALE`**; en `RETURN` queda en `0` aunque haya reembolso (contradice D5/D6).
5. **`ocurredAt`** (request) vs **`occurredAt`** (response): nombres distintos.
6. **`direction`** no se rechaza en tipos distintos de `ADJUSTMENT` por el DTO; la base de datos sí lo impide
   (check constraint) y respondería 500. No lo mandes fuera de `ADJUSTMENT`.
