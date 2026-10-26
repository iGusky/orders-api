# Pendientes

Puntos que quedaron abiertos en las revisiones de código. Marca cada uno con `[x]` cuando lo resuelvas.
Las referencias (D*n*, I*n*) apuntan a [`modelo-de-datos.md`](modelo-de-datos.md). Los temas para estudiar están en [`temas-a-investigar.md`](temas-a-investigar.md).

*Última revisión:* 2026-10-25

---

## Exception filter (`src/common/filters/domain-error.filter.ts`)

- [ ] **Registrar el filter de forma global.**
  Hoy está con `@UseFilters` en `ProductsController` y `MovementsController`. Un controller nuevo sin el decorador volvería a responder 500.
  ¿`useGlobalFilters` en `main.ts` o `APP_FILTER` en un módulo? ¿Cuál permite inyectar dependencias (por ejemplo, un logger)?

- [ ] **Decidir qué datos del error llegan al cliente: *allowlist* frente a *denylist*.**
  `data: {...exception}` envía todas las propiedades enumerables, incluido `name` (nombre de una clase interna) y cualquier propiedad que se agregue en el futuro.
  Alternativa: que cada error declare explícitamente qué expone (por ejemplo, `details` en `DomainError`). Sigue siendo un concepto de dominio, no de HTTP.

- [ ] **Subir `code` al primer nivel del body.**
  Hoy queda dentro de `data`, mezclado con los datos variables. El frontend decide con `code`, así que debería estar junto a `statusCode` y `message`.

- [ ] **Sacar la tabla `domainErrorToHttpCode` de `catch`.**
  Se construye de nuevo en cada error y es configuración fija. ¿Fuera de la clase o como propiedad de la clase? ¿Qué diferencia hay?

- [ ] **Fallback de status para un `code` no mapeado.**
  El `Record` lo impide en compilación, pero no en ejecución (`as`, `any`, `noImplicitAny: false`).
  Pistas: operador `??`. ¿Es culpa del cliente (4xx) o un bug propio (5xx)? No dejarlo en silencio: ¿cómo te enteras si ocurre?

- [ ] **Probar en Bruno los tres casos.**
  1. `productId` inexistente: 404, con `code` y el id.
  2. Stock insuficiente: 409, con `productId`, `quantityRequired` y `currentStock`.
  3. Un `throw new Error("x")` temporal: debe seguir siendo 500 genérico (si cambia, el filter atrapa de más).

## Excepciones de dominio

- [ ] **Decidir si se enciende `noImplicitAny` en `tsconfig.json`.**
  Con `false`, una propiedad sin tipo se vuelve `any` y escondió el typo `code: DomainError` en una revisión. Encenderlo puede revelar otros `any` en el proyecto.

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

- [ ] **409 para stock insuficiente.**
  Anotar por qué 409 y no 422.

## Para pensar

- [ ] **¿El `message` de los errores es para el usuario final o para el desarrollador del frontend?**
  Si el frontend arma sus propios textos a partir de `code`, el mensaje puede ser técnico. Influye en el idioma y el tono de los mensajes.
