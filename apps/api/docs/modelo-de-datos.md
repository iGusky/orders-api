# Modelo de datos y decisiones del MVP

> **Fuente de verdad** del diseño durante el desarrollo inicial.
> Si el código y este documento no coinciden, uno de los dos está mal: corrígelo en el mismo commit.

Última actualización: 2026-10-30

> Las secciones 1 a 7 describen el MVP. La segunda fase (tiendas y cuentas de Google) está en la [sección 8](#8-fase-2-tiendas-y-cuentas-de-google).

---

## 1. Contexto

Inventario para un negocio pequeño que vende en bazares. Las operaciones se
registran a mano, a veces horas después de ocurrir. El usuario piensa en ellas así:

> "acabo de vender un paquete de 5 stickers en 45 pesos"

Esa frase describe la **intención** del usuario, no el formato de entrada. Este proyecto es
una **API REST** que recibe **JSON estructurado** desde un frontend (fuera de este repositorio),
y el frontend es quien facilita la captura. La API no interpreta texto libre.

El MVP es para un solo usuario, pero se diseña pensando en escalar.
**Prioridad del MVP:** que el inventario (stock) sea siempre correcto. La precisión contable es secundaria.

## 2. Glosario

Los nombres en código están en inglés (ver D9). Esta tabla relaciona cada término con su nombre en código.

| Término (es)              | En código           | Significado                                                                  |
|---------------------------|---------------------|------------------------------------------------------------------------------|
| **Producto**              | `Product`           | La unidad mínima que se cuenta en inventario (ej. *un* sticker, no un paquete). |
| **Movimiento**            | `Movement`          | Un evento que cambia el stock.                                               |
| **Detalle de movimiento** | `MovementItem`      | Un renglón del movimiento: qué producto, cuántas unidades y qué importe.     |
| **Tipo de movimiento**    | `MovementType`      | El **motivo** del movimiento.                                                |
| **Dirección**             | `MovementDirectionType` | Si un ajuste **suma** (`IN`) o **resta** (`OUT`) stock. Solo se guarda en `ADJUSTMENT`. |
| **Reabastecimiento**      | `RESTOCK`           | Llega mercancía nueva.                                                       |
| **Venta**                 | `SALE`              | Se vende producto a un cliente.                                              |
| **Devolución**            | `RETURN`            | Un cliente regresa producto: vuelve al inventario y se le reembolsa dinero.  |
| **Merma**                 | `SHRINKAGE`         | Producto perdido, roto o dañado; sale del inventario sin venderse.           |
| **Ajuste**                | `ADJUSTMENT`        | Corrección de un error de captura o de una diferencia en un conteo físico.   |
| **Stock**                 | `stock`             | Unidades disponibles de un producto, calculadas a partir de sus movimientos. |
| **Precio de lista**       | `priceCents`        | Precio de referencia del producto.                                           |
| **Importe del renglón**   | `lineTotalCents`    | Dinero total del renglón (no por unidad). Su significado depende del tipo (ver D5). |

## 3. Entidades

### Product

| Campo         | Tipo              | Notas                                                    |
|---------------|-------------------|----------------------------------------------------------|
| `id`          | UUID v7           | PK. Ver D13                                              |
| `name`        | texto             |                                                          |
| `description` | texto, opcional   |                                                          |
| `priceCents`  | entero            | Precio de lista, en centavos                             |
| `stock`       | entero            | **Valor precalculado** (caché). Ver D2                   |
| `createdAt`   | fecha-hora        | Cuándo se dio de alta (lo pone el servidor)              |
| `deletedAt`   | fecha, opcional   | Borrado lógico. `null` = activo                          |

### Movement (encabezado)

Inmutable: no se edita ni se borra (D11).

| Campo         | Tipo                   | Notas                                                   |
|---------------|------------------------|---------------------------------------------------------|
| `id`          | UUID v7                | PK. Ver D13                                             |
| `type`        | enum `MovementType`: `RESTOCK` / `SALE` / `RETURN` / `SHRINKAGE` / `ADJUSTMENT` | Motivo. Ver D3 |
| `direction`   | enum `MovementDirectionType`: `IN` / `OUT`, opcional | Obligatorio en `ADJUSTMENT`; `null` en los demás tipos. Ver D3 |
| `occurredAt`  | fecha-hora             | Cuándo pasó en el mundo real (lo captura el usuario)    |
| `createdAt`   | fecha-hora             | Cuándo se guardó en el sistema (lo pone el servidor)    |
| `totalCents`  | entero                 | Σ `lineTotalCents`, desnormalizada. Ver D6              |

### MovementItem (renglón)

Inmutable: no se edita ni se borra (D11).

| Campo            | Tipo    | Notas                                          |
|------------------|---------|------------------------------------------------|
| `id`             | UUID v7 | PK. Ver D13                                    |
| `movementId`     | UUID v7 | FK → Movement                                  |
| `productId`      | UUID v7 | FK → Product                                   |
| `quantity`       | entero  | Siempre **> 0**. Ver D3                        |
| `lineTotalCents` | entero  | Importe total del renglón. Depende de `type`. Ver D5 |

### Relaciones

```
Product 1 ──── N MovementItem N ──── 1 Movement
```

Un movimiento tiene uno o más detalles. Un producto aparece en muchos detalles.

## 4. Decisiones

Formato: **decisión** → por qué → consecuencia que hay que respetar.

**D1. El inventario se lleva como libro de movimientos.**
Por qué: da historial auditable y cubre entradas, ventas y ajustes con una sola estructura.
Consecuencia: el stock no se "edita"; cambia únicamente al registrar un movimiento.

**D2. Modelo híbrido: movimientos como fuente de verdad + `Product.stock` como caché.**
Por qué: sumar todo el historial en cada consulta no escala.
Consecuencia: registrar un movimiento y actualizar `stock` ocurre **en la misma transacción**.
Ver invariantes I1 e I2.

**D3. La dirección se deduce de `type`, excepto en `ADJUSTMENT`, que la guarda en `direction`; `quantity` siempre es positiva.**
Por qué: en los tipos normales la dirección nunca cambia, así que guardarla sería redundante.
Solo el ajuste puede sumar o restar, y por eso es el único que la guarda.

| `type`       | Dirección efectiva                 | `direction` guardado |
|--------------|------------------------------------|----------------------|
| `RESTOCK`    | entra (+)                          | `null`               |
| `RETURN`     | entra (+)                          | `null`               |
| `SALE`       | sale (−)                           | `null`               |
| `SHRINKAGE`  | sale (−)                           | `null`               |
| `ADJUSTMENT` | la que diga `direction`            | `IN` u `OUT`         |

Consecuencias:
- stock = Σ quantity(`RESTOCK`, `RETURN`, `ADJUSTMENT IN`) − Σ quantity(`SALE`, `SHRINKAGE`, `ADJUSTMENT OUT`).
- La regla "tipo → dirección efectiva" debe existir en **un solo lugar** del código; agregar un tipo nuevo obliga a definirla.
- Ver I9.

**D4. El dinero se guarda en centavos, como entero.**
Por qué: evita errores de redondeo de punto flotante.
Consecuencia: todo campo monetario lleva el sufijo `Cents`. La conversión a pesos
solo se hace al presentar los datos, y la hace el cliente (D15).

**D5. Cada renglón guarda su importe total (`lineTotalCents`), no un precio unitario.**
Por qué: el usuario conoce y captura el total ("3 stickers en 20 pesos"). El precio unitario (666.67) no es un dato real,
es una división del sistema, y redondearlo a entero pierde centavos (3 × 667 = 2001).

| `type`       | `lineTotalCents`                  |
|--------------|-----------------------------------|
| `SALE`       | Dinero cobrado por el renglón     |
| `RETURN`     | Dinero reembolsado por el renglón |
| `RESTOCK`    | `0`                               |
| `SHRINKAGE`  | `0`                               |
| `ADJUSTMENT` | `0`                               |

Ejemplo: "5 stickers en 45 pesos" → producto *sticker*, `quantity: 5`, `lineTotalCents: 4500`.
Consecuencias:
- El precio unitario no se guarda. Si hace falta mostrarlo, se calcula (`lineTotalCents / quantity`) solo para presentación.
- El MVP no maneja costos: no se puede calcular ganancia ni cuantificar pérdidas por merma.

**D6. `totalCents` se guarda en el encabezado.**
Por qué: consultar las ventas del día sin tener que sumar los detalles.
Consecuencias: siempre debe cumplirse I3; el total y los detalles se escriben juntos.
Como `totalCents` significa cosas distintas según el tipo (D5), **nunca se suman totales de
tipos distintos** sin aplicar su signo:
- Ventas brutas = Σ `totalCents` de `SALE`.
- Ventas netas = Σ `SALE` − Σ `RETURN`.

**D7. Borrado lógico (`deletedAt`) en todas las entidades, excepto `Movement` y `MovementItem`.**
Por qué: los movimientos históricos siguen haciendo referencia a productos que ya no se venden.
Consecuencia: todas las consultas "normales" deben filtrar `deletedAt IS NULL`. Los movimientos
no se borran de ninguna forma (D11).

**D8. Dos fechas por movimiento: `occurredAt` y `createdAt`.**
Por qué: el registro es manual y puede hacerse horas después de la venta.
Consecuencia: los reportes de ventas se basan en `occurredAt`.

**D9. El código se escribe en inglés; la documentación, en español.**
Por qué: coherencia con el framework, las librerías y el código existente.
Consecuencia: clases, propiedades, enums, rutas y tablas van en inglés. El glosario (sección 2)
relaciona cada término de negocio con su nombre en código.

**D10. Devoluciones y mermas son tipos de movimiento propios (`RETURN`, `SHRINKAGE`).**
Por qué: distinguir una venta de una pérdida, y una entrada de mercancía nueva de una devolución,
sin depender de reglas implícitas como "importe 0 = merma".
Consecuencia: una devolución aumenta el stock y registra el dinero reembolsado (D5). No se liga a la venta original.

**D11. Los movimientos son inmutables: sin borrado físico ni lógico, y sin edición.**
Por qué: son la fuente de verdad del stock (D2). Borrar o editar uno rompería I1 y podría romper I2
(ej. eliminar una entrada cuyas unidades ya se vendieron).
Consecuencia: los errores de captura se corrigen con un movimiento `ADJUSTMENT` (D12).

**D12. Las correcciones se registran como `ADJUSTMENT`, con dirección explícita.**
Por qué: corregir con `RETURN` o `SHRINKAGE` haría que los reportes mostraran devoluciones o
pérdidas que nunca ocurrieron.
Ejemplo: se registró "vendí 50 stickers" en lugar de 5 → `ADJUSTMENT`, `direction: IN`, `quantity: 45`.
Consecuencias:
- También sirve para cuadrar el stock después de un conteo físico.
- Un ajuste corrige el **stock**, no el **dinero** (`lineTotalCents` = 0). Ver P9.

**D13. Los identificadores son UUID v7, generados por la base de datos/Prisma (`@default(uuid(7))`).**
Por qué: a diferencia de un entero autoincremental, no revela cuántos registros existen ni permite adivinar
IDs vecinos, y se puede generar sin coordinarse con la base de datos. A diferencia de UUID v4, empieza con un
timestamp, así que los IDs nuevos quedan ordenados y los índices B-tree no se fragmentan.
Consecuencias:
- Los IDs se ordenan aproximadamente por fecha de creación, pero **no** sustituyen a `occurredAt` (D8).
- Todas las FK usan el mismo tipo que la PK que referencian.

**D14. La base de datos es PostgreSQL.**
Por qué: soporta lo que el diseño necesita para escalar y mantener la consistencia: bloqueos de fila
(`SELECT ... FOR UPDATE`, para I2), `CHECK constraints` (para I4, I9 e I10), tipos nativos (`uuid`,
`timestamptz`) y concurrencia real de escritura.
Consecuencias:
- El historial de migraciones de SQLite no es compatible y se reinicia.
- `PrismaService` debe usar el adaptador de PostgreSQL en lugar de `better-sqlite3`.
- Estado actual: el schema ya apunta a PostgreSQL; el código de conexión aún usa SQLite (migración pendiente).

**D15. La API recibe y devuelve el dinero en centavos; la conversión a pesos es responsabilidad del cliente.**
Por qué: D4 limita la conversión a pesos al momento de presentar los datos, y quien los presenta es el frontend.
Si la API aceptara pesos, tendría que redondear decimales de punto flotante (`0.29 * 100 = 28.999…`) y
decidir qué hacer con montos de más de dos decimales.
Consecuencias:
- Todo campo monetario del contrato de la API (DTOs de entrada y respuestas) lleva el sufijo `Cents` y es un
  entero, igual que en la base de datos. Así, un cliente que mande pesos por error es más fácil de detectar.
- El backend no convierte entre pesos y centavos en ningún punto.
- La validación de entrada exige enteros dentro del rango de la columna (`Int` de 32 bits). Un valor fuera de
  rango debe responder 400, no un error de la base de datos.
- El frontend convierte lo que captura el usuario ("45.50 pesos" → `4550`) y debe redondear al entero más cercano.

## 5. Invariantes

Reglas que **siempre** deben cumplirse. Cada una debería tener al menos una prueba.

- **I1.** `Product.stock` = Σ quantity de detalles con dirección efectiva de entrada − Σ quantity de los de salida (tabla de D3).
- **I2.** `Product.stock` nunca es negativo: no se puede sacar lo que no hay, **incluso con dos peticiones simultáneas**.
- **I3.** `Movement.totalCents` = Σ `lineTotalCents` de sus detalles.
- **I4.** `quantity` > 0 en todo detalle.
- **I5.** Un movimiento tiene al menos un detalle.
- **I6.** No se pueden registrar movimientos de un producto eliminado.
- **I7.** En movimientos `RESTOCK`, `SHRINKAGE` y `ADJUSTMENT`, `lineTotalCents` = 0 y `totalCents` = 0.
- **I8.** Un movimiento y sus detalles no cambian después de crearse.
- **I9.** `direction` es obligatorio si `type = ADJUSTMENT` y es `null` en cualquier otro tipo.
- **I10.** `lineTotalCents` ≥ 0.

## 6. Fuera del alcance del MVP

- Zonas horarias: las fechas se tratan como vienen; no se define todavía a qué "día" pertenece una venta.
- Costos: costo de compra, cálculo de ganancia y valor de las pérdidas por merma.
- Precio unitario y precio promedio de venta.
- Reglas automáticas de precio por volumen (el importe lo indica el usuario en cada venta).
- Interpretar texto en lenguaje natural: la API solo recibe JSON estructurado.
- El frontend (vive en otro repositorio).
- Ligar una devolución o un ajuste con el movimiento original.
- Múltiples usuarios, autenticación y multi-tenancy (pasan a la fase 2, sección 8).

## 7. Preguntas abiertas

~~**P1. Precios que no se dividen exacto.**~~ Resuelta en D5 (`lineTotalCents`).

~~**P2. ¿Borrado lógico en movimientos?**~~ Resuelta en D11.

~~**P3. Distinguir venta de merma.**~~ Resuelta en D10.

**P4. Borrado lógico y unicidad.** Si `name` de producto debe ser único, ¿se puede crear
"Sticker" de nuevo si ya existe uno eliminado con ese nombre? Con la fase 2, la unicidad sería
**por tienda**: dos tiendas pueden tener un "Sticker".

~~**P5. ¿De dónde sale el costo para las mermas?**~~ Resuelta: el MVP no maneja costos; la merma vale `0` (D5).

~~**P6. ¿`IN`/`OUT` siguen siendo buenos nombres?**~~ Resuelta: se renombran a `RESTOCK` y `SALE`.

~~**P7. Devoluciones y dinero.**~~ Resuelta: `RETURN` registra el reembolso (D5, D6, D10).

~~**P8. ¿Cómo se corrige un error de captura?**~~ Resuelta en D12 (`ADJUSTMENT`).

**P9. Corregir el dinero de una venta mal capturada.** Si se registró "vendí 5 stickers en 450 pesos"
en lugar de 45, las unidades están bien pero las ventas del día quedan infladas en $405, y un
`ADJUSTMENT` no toca dinero. ¿Se acepta para el MVP (la prioridad es el stock), o hace falta una
forma de corregir importes?

## 8. Fase 2: tiendas y cuentas de Google

> **Estado: diseño, sin implementar.** Lo que dice esta sección todavía no existe en el código y no cuenta como
> discrepancia. Al implementar cada parte, muévela a las secciones 2 a 5 en el mismo commit.

### 8.1 Objetivo

Pasar de un negocio único a muchos negocios independientes en la misma aplicación:

- Una persona entra con su **cuenta de Google**, sin crear una contraseña.
- Esa persona registra su **Tienda**, que representa a su negocio (nombre, dirección, teléfono y otros datos).
- Cada tienda tiene **sus propios productos y movimientos**, y nadie más puede verlos ni modificarlos.

### 8.2 Glosario

| Término (es) | En código | Significado                                                                     |
|--------------|-----------|---------------------------------------------------------------------------------|
| **Usuario**  | `User`    | La persona que entra con Google. Es la identidad, no el negocio.                |
| **Tienda**   | `Store`   | El negocio de esa persona. Es dueña de los productos y movimientos (*tenant*).  |
| **Dueño**    | `owner`   | El usuario al que pertenece una tienda.                                         |

### 8.3 Entidades

#### User (nueva)

| Campo        | Tipo            | Notas                                                     |
|--------------|-----------------|-----------------------------------------------------------|
| `id`         | UUID v7         | PK. Ver D13                                               |
| `googleSub`  | texto, único    | Identificador de la persona en Google (`sub`). Ver D20    |
| `email`      | texto           | Copia de Google; se refresca al entrar. No identifica     |
| `name`       | texto           | Copia de Google                                           |
| `avatarUrl`  | texto, opcional | Copia de Google                                           |
| `createdAt`  | fecha-hora      | Lo pone el servidor                                       |
| `deletedAt`  | fecha, opcional | Borrado lógico (D7). Ver P15                              |

#### Store (nueva)

| Campo          | Tipo            | Notas                                                     |
|----------------|-----------------|-----------------------------------------------------------|
| `id`           | UUID v7         | PK. Ver D13                                               |
| `ownerId`      | UUID v7, único  | FK → User. Ver D16                                        |
| `name`         | texto           | Nombre del negocio                                        |
| `address`      | texto           | Ver P13                                                   |
| `phone`        | texto           | Texto, no número: conserva `+` y ceros a la izquierda     |
| `description`  | texto, opcional | Propuesta                                                 |
| `contactEmail` | texto, opcional | Propuesta: el correo del negocio puede no ser el de Google |
| `timezone`     | texto, opcional | Propuesta: zona IANA. Dejaría listo definir a qué "día" pertenece una venta (sección 6) |
| `createdAt`    | fecha-hora      | Lo pone el servidor                                       |
| `deletedAt`    | fecha, opcional | Borrado lógico (D7). Ver P15                              |

#### Cambios en entidades existentes

| Entidad        | Cambio                    | Notas                                     |
|----------------|---------------------------|-------------------------------------------|
| `Product`      | `storeId` (FK → Store)    | Obligatorio e inmutable. Ver D17          |
| `Movement`     | `storeId` (FK → Store)    | Obligatorio e inmutable. Ver D17          |
| `MovementItem` | Sin cambios               | Hereda la tienda de su movimiento. Ver P14 |

#### Relaciones

```
User 1 ──── 0..1 Store 1 ──┬── N Product  1 ──── N MovementItem
                           └── N Movement 1 ──── N MovementItem
```

### 8.4 Decisiones

**D16. Una persona tiene como máximo una tienda.**
Por qué: es lo que necesita el negocio hoy.
Consecuencias:
- La FK vive en `Store` (`ownerId` único). Permitir varias tiendas después solo requiere quitar la unicidad.
- Puede existir un usuario sin tienda: es el estado de quien acaba de entrar por primera vez.
- Empleados o varios usuarios por tienda quedan fuera del alcance (8.8).

**D17. La tienda es el límite de aislamiento: `storeId` en `Product` y `Movement`, con base de datos y esquema compartidos.**
Por qué: una sola base con una columna discriminadora es lo más simple de operar y migrar, y escala a muchas tiendas pequeñas.
Consecuencias:
- El stock y el resto de las reglas (D1 a D15) no cambian: siguen siendo por producto, y cada producto pertenece a una tienda.
- Toda consulta debe filtrar por `storeId`. Un solo filtro olvidado expone datos de otro negocio, por lo que
  hace falta una prueba de aislamiento por endpoint (I13).
- Los índices empiezan por `storeId` (por ejemplo, `storeId` + `occurredAt` en `Movement`).

**D18. El `storeId` sale de la sesión, nunca de lo que envía el cliente.**
Por qué: un valor que viene en el body, la query o la URL se puede cambiar por el de otra tienda.
Consecuencias:
- Los DTOs no incluyen `storeId` y las rutas siguen siendo `/products` y `/movements`.
- Si `ValidationPipe` no descarta campos desconocidos, hay que asegurarse de que un `storeId` en el body no llegue a Prisma.

**D19. Un recurso de otra tienda responde 404, igual que uno que no existe.**
Por qué: un 403 confirmaría que ese ID existe.
Consecuencia: se reutilizan los errores de dominio existentes, como `ProductNotFoundError`.

**D20. Google es el único proveedor de identidad, y la persona se identifica por `sub`, no por correo.**
Por qué: no guardar contraseñas elimina esa superficie de riesgo. El `sub` no cambia nunca; el correo sí puede cambiar.
Consecuencias:
- `googleSub` es la llave para encontrar al usuario. `email`, `name` y `avatarUrl` son copias.
- Quien no tiene cuenta de Google no puede entrar.

**D21. Google autentica; la sesión es de la API.**
Por qué: el frontend no es de confianza, así que la API debe comprobar por sí misma quién es la persona.
Consecuencias:
- La API verifica el ID token de Google (firma, `aud`, `iss`, `exp`) antes de crear o encontrar al usuario.
- Después emite su propia sesión; el token de Google no se usa en cada petición.
- Todo endpoint exige sesión salvo los marcados explícitamente como públicos (autenticación por defecto, no por excepción).

### 8.5 Invariantes

- **I11.** Todo `Product` y `Movement` pertenece a exactamente una tienda, y esa tienda no cambia.
- **I12.** Todos los productos de un movimiento pertenecen a la misma tienda que el movimiento.
- **I13.** Ninguna operación lee, cuenta o modifica datos de otra tienda. Incluye totales y conteos de paginación.
- **I14.** Un usuario es dueño de máximo una tienda activa.
- **I15.** `User.googleSub` es único.

### 8.6 API propuesta

| Método y ruta       | Qué hace                                                      |
|---------------------|---------------------------------------------------------------|
| `POST /auth/google` | Recibe la credencial de Google y crea la sesión (ver P10, P11) |
| `POST /auth/logout` | Cierra la sesión                                              |
| `GET /me`           | Usuario actual y su tienda, si tiene. El frontend decide con esto si muestra el alta de tienda |
| `POST /stores`      | Crea la tienda del usuario. 409 si ya tiene una (I14)         |
| `GET /stores/me`    | Datos de su tienda                                            |
| `PATCH /stores/me`  | Edita los datos de su tienda                                  |

- `/products` y `/movements` conservan sus rutas y pasan a exigir sesión y tienda.
- Un usuario sin tienda que llame a esos endpoints recibe un error de dominio con su propio `errorCode`.
- Módulos nuevos: `auth`, `users` y `stores`. `products` y `movements` obtienen la tienda de la sesión.

### 8.7 Plan por etapas

1. **Cerrar la deuda del MVP.** Ver "Antes de la fase 2" en [`pendientes.md`](pendientes.md). Multiplicar tiendas
   también multiplica cualquier error de stock, y el conteo sin filtros se volvería una fuga entre tiendas.
2. **Autenticación.** `User`, login con Google, sesión y protección por defecto de los endpoints.
3. **Tienda.** `Store` y los endpoints de 8.6.
4. **Aislamiento.** `storeId` en `Product` y `Movement`, filtros en todas las consultas y pruebas de I12 e I13. Si se
   conservan los datos actuales (P12), la migración va en pasos: columna opcional, asignar la tienda, y hacerla obligatoria.
5. **Frontend** (`apps/web`). Login, alta y edición de la tienda, envío de la sesión en `services/api` y actualización de `docs/api.md`.

### 8.8 Fuera del alcance de esta fase

- Varias tiendas por persona.
- Empleados, roles o invitaciones a una tienda.
- Otros métodos de acceso (correo y contraseña, Apple, Facebook).
- Monedas distintas por tienda.
- Tienda pública o catálogo visible para clientes.

### 8.9 Preguntas abiertas

**P10. ¿Cómo llega la credencial de Google a la API?** Botón de Google Identity Services, donde el frontend recibe un
ID token y lo envía a `POST /auth/google`, o *Authorization Code* con PKCE, donde la API hace el intercambio con Google.
Inclinación: el botón, porque solo necesitamos saber quién es la persona, no acceder a sus datos de Google.

**P11. ¿Cómo es la sesión de la API?** JWT o sesión guardada en base de datos; cookie `httpOnly` o encabezado
`Authorization`. Depende de cómo se revoca una sesión y de si el frontend y la API se publican en el mismo sitio.
Inclinación: cookie `httpOnly`, para que el JavaScript de la página no pueda leerla. Exige resolver CSRF y cambiar
el CORS actual (`origin: "*"` no es compatible con credenciales).

**P12. ¿Se conservan los datos actuales?** Si son de prueba, se puede reiniciar la base. Si son reales, hay que
asignarlos a la tienda de su dueño: esa persona debe entrar con Google y crear su tienda antes de la etapa 4.

**P13. ¿Cómo se captura la dirección?** Se vende principalmente en bazares, así que puede no existir un local fijo.
¿Debe ser obligatoria? ¿Basta con un texto o hacen falta campos separados (calle, ciudad, código postal)?

**P14. ¿Quién hace cumplir I12?** El service, o también la base de datos con una FK compuesta `(productId, storeId)`,
lo que obligaría a guardar `storeId` en `MovementItem`. La segunda opción protege contra bugs, a cambio de desnormalizar.

**P15. ¿Qué pasa al eliminar una cuenta o una tienda?** D7 pide borrado lógico y D11 prohíbe borrar movimientos.
¿Los datos se conservan para siempre? ¿Qué implica para los datos personales (`email`, `name`, teléfono)?
¿Se puede crear una tienda nueva después de eliminar la anterior? Afecta cómo se hace cumplir I14 junto con `deletedAt`.
