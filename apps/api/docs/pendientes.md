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
  No es compatible con cookies o credenciales (P11).

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
