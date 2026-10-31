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

- [x] **Migraciones: no editar las que ya se aplicaron; `migrate dev --create-only`.**
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

- [x] **Paginación por offset frente a paginación por cursor (keyset).**
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

- [ ] **Rollback de la base de datos frente a acciones compensatorias (patrón *Saga*).**
  ¿Por qué "borrar a mano lo que ya insertaste" en un `catch` no equivale a un `ROLLBACK`? ¿Qué pasa si el proceso se cae entre el insert y el borrado, o si otra petición lee el registro en medio? ¿Cuándo sí hacen falta acciones compensatorias (pista: varias bases de datos o servicios externos, donde no hay una sola transacción)?
  *Para qué:* entender por qué I3 (movimiento e items atómicos) se resuelve con una transacción y no con try/catch, y qué cambiaría si el stock viviera en otro servicio.
  *Agregado:* 2026-10-26

- [ ] **Escrituras anidadas de Prisma (nested writes).**
  ¿Qué hace `create` con `data: { relacion: { create: [...] } }`? ¿Prisma lo ejecuta dentro de una transacción? ¿Cuándo basta con eso y cuándo hace falta una transacción interactiva?
  *Para qué:* crear `Movement` + `MovementItem`s de forma atómica (I3).
  *Agregado:* 2026-10-24

- [ ] **Niveles de aislamiento en PostgreSQL (`READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`).**
  ¿Las sentencias de una misma transacción ven la misma "foto" de la base de datos en `READ COMMITTED`? ¿Cómo se cambia el nivel en `$transaction` de Prisma (`isolationLevel`)?
  *Para qué:* que `findMany` y `count` de `GET /products` sean consistentes entre sí, y más adelante I2 (stock nunca negativo).
  *Agregado:* 2026-10-08

- [ ] **Deadlocks al actualizar varias filas en una transacción.**
  ¿Qué pasa si una transacción bloquea el producto A y luego el B, y otra al mismo tiempo bloquea B y luego A? ¿Qué hace PostgreSQL cuando lo detecta (error `40P01`)? ¿Por qué ordenar las actualizaciones (por ejemplo, por `productId`) lo evita? ¿Cuándo conviene reintentar la transacción?
  *Para qué:* un movimiento con varios items actualiza el `stock` de varios productos en la misma transacción (D2, I2).
  *Agregado:* 2026-10-24

- [ ] **Advisory locks de PostgreSQL y serializar por tienda.**
  ¿Qué hace `pg_advisory_xact_lock` y en qué se diferencia de un bloqueo de fila? Si cada transacción toma un solo lock por tienda, ¿por qué no puede formarse un deadlock entre ellas? ¿Cuánto rendimiento se pierde? Comparar con una cola con un solo consumidor por tienda.
  *Para qué:* alternativa a ordenar los bloqueos cuando un movimiento toca varios productos (D2, I2, D17).
  *Agregado:* 2026-10-30

- [ ] **Conciliar una caché con su fuente de verdad.**
  ¿Cómo detectar que `Product.stock` ya no coincide con la suma de los movimientos? ¿Conviene un endpoint o job que recalcule y compare? ¿Qué son los *snapshots* en *event sourcing* y en qué se parecen a `stock`?
  *Para qué:* verificar I1 y tener con qué reparar el stock si algún bug lo descuadra (D2).
  *Agregado:* 2026-10-24

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

## Diseño de la API y respuestas

- [ ] **Ciclo de vida de una petición en Nest (*request lifecycle*).**
  ¿En qué orden se ejecutan middleware, guards, interceptors, pipes, el handler y los exception filters? ¿Qué partes ven la respuesta exitosa y cuáles ven el error?
  *Para qué:* saber dónde colocar el "sobre" (*envelope*) de respuesta estándar `{ statusCode, data, message }`.
  *Agregado:* 2026-10-25

- [ ] **Interceptors y el operador `map` de RxJS.**
  ¿Qué devuelve `next.handle()` y por qué es un `Observable`? ¿Cómo se transforma el valor que regresa el controller? ¿Cómo se lee el status HTTP real desde `ExecutionContext`? ¿Qué pasa con el interceptor si el handler usa `@Res()`?
  *Para qué:* envolver todas las respuestas exitosas con la misma estructura sin repetir código en cada controller.
  *Agregado:* 2026-10-25

- [ ] **Exception filters globales y fuga de información.**
  ¿Qué responde Nest por defecto ante una `HttpException` y ante un error desconocido (por ejemplo, de Prisma)? ¿Cómo se usa `@Catch()` con `ArgumentsHost`? ¿Por qué no hay que devolver `error.message` de un error interno al cliente?
  *Para qué:* que los errores también usen la estructura estándar, sin exponer detalles de la base de datos.
  *Agregado:* 2026-10-25

- [ ] **`statusCode` en el body frente al status HTTP; RFC 9457 (*Problem Details*).**
  ¿Qué gana y qué pierde un cliente si el status viene duplicado en el body? ¿Qué propone RFC 9457 para errores (`type`, `title`, `status`, `detail`)? ¿Dónde va la metadata de paginación (`data` + `meta`)?
  *Para qué:* decidir el contrato de respuesta de la API (y registrarlo como decisión en `modelo-de-datos.md`).
  *Agregado:* 2026-10-25

- [ ] **Metadata por endpoint: `SetMetadata` / `Reflector.createDecorator` y `Reflector`.**
  ¿Cómo un decorador propio (por ejemplo, `@ResponseMessage('Movimiento creado')`) deja un dato que un interceptor puede leer después?
  *Para qué:* llenar el campo `message` de la respuesta estándar sin que el service conozca detalles HTTP.
  *Agregado:* 2026-10-25

- [ ] **Elegir el status HTTP de un error de negocio: 400, 403, 409 o 422.**
  ¿Qué significa realmente 403 (pista: autorización)? ¿Cuál es la diferencia entre 409 *Conflict* y 422 *Unprocessable Content*? ¿Cuál corresponde a "no hay stock suficiente"? ¿Qué subclases de `HttpException` trae Nest (`NotFoundException`, `ConflictException`, ...)?
  *Para qué:* que el frontend pueda distinguir "el producto no existe" de "no alcanza el stock" (I2) solo con el status.
  *Agregado:* 2026-10-25

- [ ] **Excepciones de dominio frente a `HttpException` en los services.**
  ¿Debe un service saber que existe HTTP? ¿Qué pasa si el mismo service se usa desde un job, un CLI o una cola? ¿Cómo se define una excepción propia (`InsufficientStockError`) y se traduce a HTTP en un exception filter?
  *Para qué:* que `MovementItemService` exprese reglas de negocio (I2) sin acoplarse al transporte.
  *Agregado:* 2026-10-25

- [ ] **Errores como valores: patrón `Result` / `Either` frente a lanzar excepciones.**
  ¿Qué diferencia hay entre un error *esperado* (no hay stock) y uno *inesperado* (se cayó la base de datos)? ¿Por qué TypeScript no te obliga a manejar un `throw` pero sí un `Result<T, E>`? ¿Qué aportan librerías como `neverthrow`? ¿Qué es la arquitectura hexagonal (*ports and adapters*) y dónde quedan ahí los controllers y los workers?
  *Para qué:* decidir cómo comunica `MovementItemService` sus reglas de negocio (I2) a quien lo llame, sea HTTP o un job.
  *Agregado:* 2026-10-25

## Autenticación y multi-tenancy

- [ ] **OAuth 2.0 frente a OpenID Connect.**
  ¿Qué problema resuelve cada uno? ¿Qué diferencia hay entre un ID token y un access token, y por qué un access token no sirve para demostrar quién es la persona?
  *Para qué:* entender qué le pide la app a Google (D20, D21).
  *Agregado:* 2026-10-30

- [ ] **Google Identity Services frente a *Authorization Code* con PKCE.**
  ¿Quién recibe la credencial en cada flujo? ¿Qué problema resuelve PKCE? ¿Para qué sirven `state` y `nonce`?
  *Para qué:* resolver P10.
  *Agregado:* 2026-10-30

- [ ] **Verificar un ID token en el backend.**
  ¿Qué es un JWT y qué comprueba su firma? ¿Qué es JWKS? ¿Por qué hay que validar `aud`, `iss` y `exp`? ¿Qué hace `google-auth-library`? ¿Por qué se identifica a la persona por `sub` y no por `email`?
  *Para qué:* implementar D20 y D21 sin confiar en lo que envía el frontend.
  *Agregado:* 2026-10-30

- [ ] **Sesiones en servidor frente a JWT propios.**
  ¿Cómo se revoca un JWT antes de que expire? ¿Qué son los *refresh tokens* y su rotación? ¿Qué cuesta consultar una sesión en base de datos en cada petición?
  *Para qué:* resolver P11.
  *Agregado:* 2026-10-30

- [ ] **Cookie `httpOnly` frente a `localStorage`; XSS y CSRF.**
  ¿A qué ataque queda expuesta cada opción? ¿Qué hacen `SameSite`, `Secure` y `httpOnly`? ¿Qué es un sitio frente a un origen?
  *Para qué:* decidir dónde vive la sesión en el navegador (P11).
  *Agregado:* 2026-10-30

- [ ] **CORS con credenciales.**
  ¿Qué protege realmente CORS? ¿Qué es una petición *preflight*? ¿Por qué `Access-Control-Allow-Origin: *` no funciona junto con cookies?
  *Para qué:* configurar `enableCors` en `main.ts` para el frontend.
  *Agregado:* 2026-10-30

- [ ] **Guards globales y decoradores propios en Nest.**
  ¿Cómo se registra un guard con `APP_GUARD`? ¿Cómo un decorador `@Public()` excluye una ruta? ¿Cómo se crea `@CurrentUser()` con `createParamDecorator`? ¿Qué diferencia hay entre autenticación y autorización?
  *Para qué:* exigir sesión por defecto (D21) y obtener la tienda de la sesión (D18).
  *Agregado:* 2026-10-30

- [ ] **Estrategias de multi-tenancy.**
  Comparar columna `tenant_id`, un esquema por tenant y una base por tenant: aislamiento, costo y migraciones. ¿Qué es un *noisy neighbor*?
  *Para qué:* entender la decisión de D17 y cuándo habría que reconsiderarla.
  *Agregado:* 2026-10-30

- [ ] **Row Level Security (RLS) de PostgreSQL.**
  ¿Cómo aplica la base el filtro por tenant aunque la app lo olvide? ¿Cómo se usa con un pool de conexiones y `SET LOCAL`? ¿Cómo se integra con Prisma?
  *Para qué:* una segunda capa de defensa para I13.
  *Agregado:* 2026-10-30

- [ ] **IDOR / *Broken Object Level Authorization* (BOLA).**
  ¿Por qué un UUID difícil de adivinar no sustituye a la autorización? ¿Cuándo conviene responder 404 en lugar de 403? ¿Cómo se prueba que un usuario no alcanza datos ajenos?
  *Para qué:* D18, D19 e I13.
  *Agregado:* 2026-10-30

- [ ] **Hacer cumplir el tenant con llaves foráneas compuestas.**
  ¿Qué es una FK de varias columnas y qué exige de la tabla referenciada? ¿Se puede declarar en Prisma?
  *Para qué:* resolver P14 (I12).
  *Agregado:* 2026-10-30

- [ ] **Índices compuestos y orden de columnas.**
  ¿Por qué importa el orden en `(storeId, occurredAt)`? ¿Qué consultas aprovecha ese índice y cuáles no? ¿Qué es la regla del prefijo izquierdo?
  *Para qué:* que las consultas por tienda sigan siendo rápidas con muchas tiendas (D17).
  *Agregado:* 2026-10-30

- [ ] **Índices únicos parciales y borrado lógico.**
  ¿Qué es `CREATE UNIQUE INDEX ... WHERE "deletedAt" IS NULL`? ¿Se puede declarar en Prisma o va en SQL a mano dentro de la migración?
  *Para qué:* I14 si se puede crear otra tienda tras eliminar la anterior (P15), y P4 por tienda.
  *Agregado:* 2026-10-30

- [ ] **Migraciones en varios pasos (*expand and contract*).**
  ¿Por qué falla agregar una columna `NOT NULL` sin valor por defecto a una tabla con datos? ¿Cómo se hace por pasos sin detener la aplicación?
  *Para qué:* agregar `storeId` a `Product` y `Movement` conservando los datos (P12).
  *Agregado:* 2026-10-30

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
