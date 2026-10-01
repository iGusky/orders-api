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

## TypeScript y tooling

- [ ] **`paths` de `tsconfig` frente a `imports` de `package.json` (subpath imports).**
  ¿Por qué `tsc` no reescribe los alias al compilar? ¿Cómo resuelve Node ESM un especificador que empieza con `@` o con `#`? ¿Qué son las *conditions* (`types`, `default`) en `imports`?
  *Para qué:* usar alias (`#src/...`) que funcionen en compilación y en ejecución con `"type": "module"`.
  *Agregado:* 2026-09-29

- [ ] **¿Nest llama al `constructor` de un DTO?**
  ¿Qué es realmente `@Body()` sin `ValidationPipe({ transform: true })`? ¿Qué hace `class-transformer` con `plainToInstance`?
  *Para qué:* `CreateProductDto` convierte pesos a centavos (D4) en su constructor; hay que saber si esa línea llega a ejecutarse.
  *Agregado:* 2026-09-29

## Opcionales (ya decididos, para profundizar)

- [ ] **Dinero: centavos frente a `Decimal` frente a `float`.** Decidido en D4.
- [ ] **Soft delete: ventajas y problemas** (por ejemplo, con índices únicos; ver P4). Decidido en D7.
- [ ] **Asientos de reversa en contabilidad.** Cómo se corrige un error sin borrar el registro. Decidido en D11 y D12.
