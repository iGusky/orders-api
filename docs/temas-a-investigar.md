# Temas a investigar

Lista de temas que surgen durante el desarrollo. Marca cada uno con `[x]` cuando lo hayas investigado.
Las referencias (D*n*, I*n*) apuntan a [`modelo-de-datos.md`](modelo-de-datos.md).

---

## Base de datos y Prisma

- [x] **`CHECK constraint` en Prisma.**
  ¿Se puede declarar en `schema.prisma` o hay que agregarlo a mano en la migración SQL?
  *Para qué:* hacer cumplir I9 (`direction` obligatorio solo en `ADJUSTMENT`) desde la base de datos.
  *Agregado:* 2026-09-28

- [x] **Límite de `Int` para dinero en centavos.**
  ¿Cuántos pesos caben en un entero de 32 bits? ¿Cuándo conviene `BigInt`?
  *Para qué:* D4 (dinero en centavos) pensando en escala.
  *Agregado:* 2026-09-28

- [] **Cómo guarda Prisma los `DateTime`.**
  ¿En qué zona horaria se almacenan? ¿Qué pasa al leerlos?
  *Para qué:* D8 (`occurredAt` / `createdAt`). La zona horaria está fuera del MVP, pero Prisma ya decide algo.
  En PostgreSQL, comparar `timestamp` con `timestamptz` (`@db.Timestamptz`).
  *Agregado:* 2026-09-28

- [x] **`@db.Uuid` frente a `String` en PostgreSQL.**
  ¿Qué tipo de columna crea Prisma para un `String` con `uuid(7)`? ¿Cuánto ocupa `text` frente al tipo nativo `uuid`?
  *Para qué:* D13 (IDs UUID v7), y el tamaño de los índices a escala.
  *Agregado:* 2026-09-29

- [ ] **Índices en llaves foráneas en PostgreSQL.**
  ¿PostgreSQL crea un índice automáticamente para una FK? ¿Y Prisma? ¿Qué es `@@index`?
  *Para qué:* consultar los movimientos de un producto y los reportes por fecha y tipo (D6, D8).
  *Agregado:* 2026-09-29

- [ ] **Acciones referenciales en Prisma (`onDelete`, `onUpdate`).**
  ¿Qué hace Prisma por defecto si se borra físicamente un `Product` que tiene `MovementItem`s?
  *Para qué:* D7 y D11 (borrado lógico y movimientos inmutables).
  *Agregado:* 2026-09-29

- [ ] **Migraciones: no editar las que ya se aplicaron; `migrate dev --create-only`.**
  ¿Qué hace Prisma si modificas una migración que ya se aplicó (checksum)? ¿Cómo se crea una migración vacía para escribir SQL a mano?
  *Para qué:* agregar `CHECK constraints` sin romper el historial de migraciones.
  *Agregado:* 2026-09-29

- [ ] **Lógica de tres valores en SQL (`NULL`) y `CHECK`.**
  ¿Qué pasa si la expresión de un `CHECK` da `NULL` en lugar de `FALSE`? ¿Por qué `x = NULL` no funciona y hay que usar `IS NULL`?
  *Para qué:* escribir bien el constraint de I9 y cualquier `CHECK` sobre columnas opcionales.
  *Agregado:* 2026-09-29

- [ ] **`CASE WHEN` en SQL y `$queryRaw` en Prisma.**
  ¿Cómo sumar cantidades con signo según el `type`? ¿Se puede con la API de Prisma o requiere SQL crudo?
  *Para qué:* recalcular el stock desde los movimientos y verificar I1.
  *Agregado:* 2026-09-28

- [ ] **Paginación por offset frente a paginación por cursor (keyset).**
  ¿Qué hace PostgreSQL con `OFFSET 100000`? ¿Por qué paginar sin `ORDER BY` da resultados repetidos o faltantes entre páginas? ¿Cómo funciona `cursor` en Prisma?
  *Para qué:* `GET /products` paginado pensando en escala. Los UUID v7 (D13) se pueden ordenar por tiempo.
  *Agregado:* 2026-10-08

- [ ] **Búsqueda parcial (`contains` / `ILIKE '%x%'`) e índices.**
  ¿Puede un índice B-tree acelerar un `ILIKE` con comodín al inicio? ¿Qué son la extensión `pg_trgm` y los índices GIN? ¿Cuándo conviene la búsqueda de texto completo (`tsvector`)?
  *Para qué:* el filtro `search` de `GET /products` sin escanear toda la tabla a escala (D14).
  *Agregado:* 2026-10-08

- [ ] **El costo de `COUNT(*)` en PostgreSQL y sus alternativas.**
  ¿Por qué `COUNT(*)` en PostgreSQL recorre las filas (pista: MVCC) en lugar de leer un contador? ¿Qué es `COUNT(*) OVER()`? ¿Cuándo basta con un "hay página siguiente" (pedir `perPage + 1`) en lugar del total?
  *Para qué:* `totalItems` y `totalPages` en `GET /products` cuando haya muchos productos.
  *Agregado:* 2026-10-08

## Concurrencia y consistencia

- [ ] **Update atómico condicional en Prisma.**
  ¿Cómo validar y restar stock en una sola sentencia, en lugar de leer, verificar y escribir?
  Buscar: *lost update*, *check-then-act*.
  *Para qué:* I2 (el stock nunca es negativo, incluso con peticiones simultáneas).
  *Agregado:* 2026-09-28

- [ ] **Optimistic locking frente a pessimistic locking.**
  Un campo `version` contra `SELECT ... FOR UPDATE`. La BD ahora es PostgreSQL: ¿cómo se usa `FOR UPDATE` desde Prisma?
  *Para qué:* I2.
  *Agregado:* 2026-09-28

- [ ] **Transacciones en Prisma.**
  `$transaction` en su forma de arreglo y en su forma interactiva: diferencias y cuándo usar cada una.
  *Para qué:* D2 (el movimiento y la actualización de `stock` se guardan juntos) e I3.
  *Agregado:* 2026-09-28

- [ ] **Propagar una transacción entre varios services.**
  ¿Por qué un `PrismaService` inyectado no "sabe" que está dentro de un `$transaction`? Comparar pasar `tx` como parámetro frente a guardarlo en `AsyncLocalStorage` (librería `@nestjs-cls/transactional`). ¿Qué es *unit of work*?
  *Para qué:* que `MovementsService` y `MovementItemService` escriban en la misma transacción (D2, I3).
  *Agregado:* 2026-10-24

- [ ] **Escrituras anidadas de Prisma (nested writes).**
  ¿Qué hace `create` con `data: { relacion: { create: [...] } }`? ¿Prisma lo ejecuta dentro de una transacción? ¿Cuándo basta con eso y cuándo hace falta una transacción interactiva?
  *Para qué:* crear `Movement` + `MovementItem`s de forma atómica (I3).
  *Agregado:* 2026-10-24

- [ ] **Niveles de aislamiento en PostgreSQL (`READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`).**
  ¿Las sentencias de una misma transacción ven la misma "foto" de la base de datos en `READ COMMITTED`? ¿Cómo se cambia el nivel en `$transaction` de Prisma (`isolationLevel`)?
  *Para qué:* que `findMany` y `count` de `GET /products` sean consistentes entre sí, y más adelante I2 (stock nunca negativo).
  *Agregado:* 2026-10-08

## Validación y capas

- [ ] **`ValidationPipe` y `class-validator`.**
  ¿Qué son? ¿Dónde se registra el pipe (global en `main.ts` o por endpoint)?
  *Para qué:* el `CreateOrderDto` actual acepta cualquier cosa. La API nunca debe confiar en el frontend.
  *Agregado:* 2026-09-28

- [ ] **¿En qué capa se valida cada regla?**
  DTO, service, entidad de dominio o base de datos: ¿qué le corresponde a cada una?
  Ejemplos: ¿dónde va I4 (`quantity > 0`)? ¿Y I9?
  *Para qué:* diseñar `movements` sin duplicar ni olvidar validaciones.
  *Agregado:* 2026-09-28

- [ ] **Validar query params: pipes sueltos frente a un DTO de query.**
  ¿Qué tipo tiene en realidad un query param (pista: `?search=a&search=b`)? ¿Qué hacen `DefaultValuePipe`, `ValidationPipe({ transform: true })` y `@Type(() => Number)` de `class-transformer`? ¿Cómo se pone un máximo a `perPage`?
  *Para qué:* que `GET /products` no responda 400 ni 500 con parámetros ausentes o fuera de rango, y que nadie pida un millón de filas.
  *Agregado:* 2026-10-08

- [ ] **Validar arreglos de objetos anidados en un DTO.**
  ¿Qué valida `class-validator` dentro de `items` si solo tiene `@IsNotEmpty()`? ¿Qué hacen `@IsArray`, `@ArrayNotEmpty`, `@ValidateNested({ each: true })` y `@Type(() => CreateMovementItemDto)`? ¿Por qué hace falta `@Type`?
  *Para qué:* que un `POST /movements` con `quantity: -5` o sin `productId` no llegue a la base de datos (I4).
  *Agregado:* 2026-10-24

- [ ] **Compartir providers entre módulos en Nest (`exports` / `imports`).**
  ¿Qué pasa si declaras `ProductsService` en `providers` de dos módulos distintos? ¿Cuántas instancias hay? ¿Cómo se exporta desde `ProductModule`?
  *Para qué:* `MovementsModule` necesitará `ProductsService` para actualizar el stock (D2).
  *Agregado:* 2026-10-24

## TypeScript y tooling

- [ ] **`paths` de `tsconfig` frente a `imports` de `package.json` (subpath imports).**
  ¿Por qué `tsc` no reescribe los alias al compilar? ¿Cómo resuelve Node ESM un especificador que empieza con `@` o con `#`? ¿Qué son las *conditions* (`types`, `default`) en `imports`?
  *Para qué:* usar alias (`#src/...`) que funcionen en compilación y en ejecución con `"type": "module"`.
  *Agregado:* 2026-09-29

- [ ] **¿Nest llama al `constructor` de un DTO?**
  ¿Qué es realmente `@Body()` sin `ValidationPipe({ transform: true })`? ¿Qué hace `class-transformer` con `plainToInstance`?
  *Para qué:* `CreateProductDto` convierte pesos a centavos (D4) en su constructor; hay que saber si esa línea llega a ejecutarse.
  *Agregado:* 2026-09-29

- [ ] **`strictPropertyInitialization`: `!` frente a `?` frente a desactivar la regla.**
  ¿Por qué TypeScript 6 marca TS2564 si el `tsconfig` no tiene `"strict": true` (pista: valores por defecto de TS 6)? ¿Qué le promete al compilador `name!: string` y qué pasa si la promesa es falsa? ¿Qué cambia en el tipo de `description` al escribir `description?: string`?
  *Para qué:* quitar los constructores de los DTOs (`CreateProductDto`, `ProductsIndexParamsDto`) sin mentirle al compilador sobre qué campos pueden ser `undefined`.
  *Agregado:* 2026-10-09

- [ ] **Documentar la API con OpenAPI (`@nestjs/swagger`).**
  ¿Cómo genera Nest la especificación a partir de los DTOs y decoradores? ¿Qué diferencia hay entre esa especificación y una colección de Bruno?
  *Para qué:* que el contrato de la API (por ejemplo, los campos `Cents` de D15) quede documentado a partir del código y no se desactualice.
  *Agregado:* 2026-09-30

- [ ] **Secretos en una colección de Bruno versionada.**
  ¿Cómo separa Bruno las variables de entorno normales de las secretas? ¿Qué archivos de la colección se guardan en Git y cuáles no?
  *Para qué:* versionar la colección sin publicar tokens ni credenciales cuando el repo sea público (portafolio).
  *Agregado:* 2026-09-30

- [ ] **`async` dentro de `forEach` y promesas flotantes.**
  ¿Por qué `forEach` no espera a un callback `async`? ¿Qué es una *floating promise* y qué pasa con su error (*unhandled rejection*)? Comparar `for...of` con `await` frente a `Promise.all`. ¿Qué regla de ESLint lo detecta (`@typescript-eslint/no-floating-promises`)?
  *Para qué:* `createMovement` hoy responde antes de que se creen los `MovementItem`s y sus errores se pierden.
  *Agregado:* 2026-10-24

## Opcionales (ya decididos, para profundizar)

- [ ] **Dinero: centavos frente a `Decimal` frente a `float`.** Decidido en D4.
- [ ] **Soft delete: ventajas y problemas** (por ejemplo, con índices únicos; ver P4). Decidido en D7.
- [ ] **Asientos de reversa en contabilidad.** Cómo se corrige un error sin borrar el registro. Decidido en D11 y D12.
