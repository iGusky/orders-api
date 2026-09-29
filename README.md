# orders-api

API para gestionar el inventario de un pequeño negocio que vende en bazares:
alta de productos, entradas de mercancía y salidas (ventas), registradas en
lenguaje natural. Por ejemplo: *"acabo de vender un paquete de 5 stickers en 45 pesos"*.

Stack: **NestJS 11** · **Prisma 7** · **SQLite** (desarrollo) · **pnpm**

📐 Modelo de datos y decisiones de diseño: [`docs/modelo-de-datos.md`](docs/modelo-de-datos.md)

---

## Estructura de carpetas

La organización es **por módulo de dominio (feature)** y no por tipo de archivo.
Todo lo que pertenece a "productos" vive junto; lo que se comparte entre módulos
vive en `common/`, `config/` o `database/`.

```
orders-api/
├── docs/                          # Diseño y decisiones (modelo de datos, ADRs)
├── prisma/                        # Esquema y migraciones (fuente de verdad de la BD)
│   ├── schema.prisma
│   └── migrations/
├── generated/prisma/              # Cliente generado por Prisma (ignorado en git)
├── src/
│   ├── main.ts                    # Arranque: crea la app, pipes globales, puerto
│   ├── app.module.ts              # Módulo raíz: solo importa otros módulos
│   │
│   ├── config/                    # Configuración tipada y validación de variables de entorno
│   │
│   ├── common/                    # Piezas transversales, sin lógica de negocio
│   │   ├── decorators/            # Decoradores propios (@CurrentUser, @Public…)
│   │   ├── filters/               # Exception filters (traducir errores a respuestas HTTP)
│   │   ├── guards/                # Autenticación / autorización
│   │   ├── interceptors/          # Logging, transformación de respuestas, timeouts
│   │   ├── pipes/                 # Validación / transformación de entrada
│   │   └── utils/                 # Funciones puras reutilizables
│   │
│   ├── database/                  # PrismaModule + PrismaService (acceso a datos compartido)
│   │
│   └── modules/                   # Un módulo Nest por contexto de negocio
│       ├── products/              # Catálogo: alta, edición, consulta de productos
│       │   ├── dto/               # Contratos de entrada/salida de la API
│       │   ├── entities/          # Representación del dominio (no del ORM)
│       │   ├── products.module.ts
│       │   ├── products.controller.ts
│       │   └── products.service.ts
│       │
│       ├── inventory/             # Movimientos de stock (entradas, salidas, ajustes)
│       │   ├── dto/
│       │   └── entities/
│       │
│       ├── sales/                 # Ventas: registra la venta y provoca una salida de inventario
│       │   ├── dto/
│       │   └── entities/
│       │
│       └── natural-language/      # Interpreta texto libre → comando estructurado
│           └── dto/
│
└── test/
    ├── jest-e2e.json
    └── e2e/                       # Pruebas end-to-end por módulo (*.e2e-spec.ts)
```

> Los archivos `*.module.ts`, `*.controller.ts`, `*.service.ts` dentro de cada
> módulo se muestran como referencia; las carpetas se crearon vacías.

### Responsabilidad de cada módulo

| Módulo             | Responsabilidad                                                                 | Depende de            |
|--------------------|---------------------------------------------------------------------------------|-----------------------|
| `products`         | Qué se vende: nombre, precio, unidad de venta (paquete de 5, pieza…).           | `database`            |
| `inventory`        | Cuánto hay. El stock se deriva de **movimientos**, no se sobreescribe a mano.   | `database`, `products`|
| `sales`            | Registrar una venta y pedir a `inventory` la salida correspondiente.            | `inventory`           |
| `natural-language` | Convertir *"vendí 5 stickers en 45 pesos"* en un DTO que `sales`/`inventory` entiendan. | —             |

La dirección de dependencias va en un solo sentido
(`natural-language → sales → inventory → products`). Si un módulo necesita
importar "hacia atrás", es señal de que la responsabilidad está mal ubicada.

### Convenciones

- **Nombres de archivo en kebab-case** con sufijo de rol:
  `create-product.dto.ts`, `products.service.ts`, `http-exception.filter.ts`.
- **Un DTO por operación** (`create-*.dto.ts`, `update-*.dto.ts`), dentro de la
  carpeta `dto/` de su módulo.
- **Pruebas unitarias junto al archivo** que prueban (`*.spec.ts`);
  pruebas e2e en `test/e2e/`.
- Un módulo solo expone (`exports`) lo que otros módulos necesitan; el resto es privado.
- Imports con extensión `.js` (el proyecto es ESM: `"type": "module"`).

### Migración desde la estructura actual

La estructura de la guía inicial aún convive con la nueva:

| Actual                         | Destino sugerido                                  |
|--------------------------------|---------------------------------------------------|
| `src/prisma/`                  | `src/database/`                                   |
| `src/orders/`                  | `src/modules/sales/` (una "orden" aquí es una venta) |
| `src/models/CreateOrderDto.ts` | `src/modules/sales/dto/create-sale.dto.ts`        |
| `src/app.controller.ts` / `app.service.ts` | Eliminar, o convertir en un endpoint de *health check* |

Cuando termines de mover todo, `src/models/`, `src/orders/` y `src/prisma/` deben desaparecer.

---

## Puesta en marcha

```bash
pnpm install
pnpm prisma migrate dev     # crea/actualiza la BD y genera el cliente
pnpm run start:dev
```

## Pruebas

```bash
pnpm run test        # unitarias
pnpm run test:e2e    # end-to-end
pnpm run test:cov    # cobertura
```
