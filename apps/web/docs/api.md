# Contrato de la API (para el frontend)

> Resumen de lo que expone `apps/api`, escrito para quien construye el frontend.
> **La fuente de verdad es el código de la API** (controllers y DTOs en `apps/api/src/modules/*`)
> y el diseño en [`apps/api/docs/modelo-de-datos.md`](../../api/docs/modelo-de-datos.md).
> Si este documento y el código no coinciden, gana el código: actualiza este archivo.

Última revisión contra el código: 2026-11-02

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
| GET    | `/movements`      | `getMovements(params)`       | Lista paginada de movimientos con renglones  |
| POST   | `/movements`      | `createMovement(input)`      | Registra un movimiento y ajusta el stock    |

No existen (todavía): editar o borrar productos, detalle de un movimiento, reportes. `OrdersController` existe en el código pero **no está registrado** en `AppModule`: `/orders` responde 404.

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
