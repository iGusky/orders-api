# Claude: frontend (`apps/web`)

A diferencia del backend (`apps/api`, donde solo actúas como tutor), **aquí sí escribes código**:
componentes, páginas, hooks, llamadas a la API y estilos. El objetivo es avanzar rápido en el frontend
con agentes, manteniendo el código consistente.

## Acerca del producto

Herramienta para un negocio pequeño que vende en bazares. El usuario registra a mano, muchas veces desde el
celular y horas después, cosas como *"acabo de vender un paquete de 5 stickers en 45 pesos"*. La UI debe
convertir esa intención en el JSON estructurado que espera la API, con la menor fricción posible.

- **Mobile first:** se usa de pie, con una mano, en un bazar. Botones grandes, pocos pasos, teclado numérico para montos.
- **El stock es lo más importante:** la UI nunca debe dejar registrar algo ambiguo.

## Fuentes de verdad

| Tema                    | Archivo                                                                 |
|-------------------------|-------------------------------------------------------------------------|
| Endpoints y contrato    | [`docs/api.md`](docs/api.md)                                            |
| Modelo y reglas de negocio | [`../api/docs/modelo-de-datos.md`](../api/docs/modelo-de-datos.md) (D*n*, I*n*) |
| Diseño visual           | [`docs/styles.md`](docs/styles.md) (tokens en `src/styles.css`)          |

- Antes de usar un endpoint, léelo en `docs/api.md`. Si sospechas que cambió, verifica contra el controller y los DTOs
  de `apps/api/src/modules/*` y **actualiza `docs/api.md`** (y los tipos en `src/types`) en el mismo cambio.
- **No modifiques nada dentro de `apps/api`.** Si el frontend necesita algo que la API no tiene o hace mal, dilo y
  propón qué cambiar; el usuario lo implementa. Tampoco agregues *workarounds* en la UI para bugs de la API sin preguntar.

## Stack

- React 19 + TypeScript (strict), Vite 8, Nx 24.
- Ruteo: `react-router` v8 (`BrowserRouter`, `Routes`, `Route` en `src/main.tsx`).
- Estilos: Tailwind CSS v4 con tokens propios en `@theme` (`src/styles.css`); la paleta por defecto está desactivada.
- Iconos: `lucide-react`. Fuentes autoalojadas: Atkinson Hyperlegible Next y Young Serif (`@fontsource*`).
- HTTP: `axios`, solo a través de `src/services/api`.
- Antes de agregar una dependencia nueva, pregunta.

## Estructura

```
src/
  main.tsx              # Punto de entrada y rutas
  styles.css            # Tailwind + estilos globales
  pages/<ruta>/index.tsx  # Una carpeta por pantalla
  components/           # Componentes reutilizables entre páginas
    PageHeader.tsx      # Botón volver + título + texto secundario
    Pagination.tsx      # Anterior / Página n de m / Siguiente
    ErrorPanel.tsx      # Error con botón Reintentar
    EmptyState.tsx      # Estado vacío con icono, frase y acción
    BottomSheet.tsx     # Hoja inferior (diálogo centrado en iPad)
    Toast.tsx           # Confirmación breve
    SearchField.tsx     # Buscador con espera de 300 ms y botón para borrar
    StockBadge.tsx      # "Quedan n" / "Agotado"
    ProductCombobox.tsx # Lista desplegable con búsqueda de productos (GET /products, primera página)
    QuantityStepper.tsx # − cantidad + (el número también se escribe)
  hooks/useQuery.ts     # Carga de datos con cancelación y reintento
  hooks/useDebouncedValue.ts
  services/api/         # Cliente de la API: una función por endpoint
    http.ts             # Instancia de axios (baseURL = VITE_API_URL)
    products.ts         # getProducts, getProductById, createProduct
    movements.ts        # getMovements, createMovement
    errors.ts           # getApiErrorBody, getDomainError
  types/                # Tipos del contrato de la API (reflejan docs/api.md)
  utils/money.ts        # pesosToCents, formatCents
  utils/dates.ts        # formatTime, formatDay ("Hoy", "Ayer", "Lunes, 26 de octubre"), dayKey
  utils/movements.ts    # Texto e icono de cada tipo de movimiento
  utils/products.ts     # LOW_STOCK_THRESHOLD y stockStatus
```

## Reglas

### API
- Páginas y componentes llaman funciones de `src/services/api` (`import { getProducts } from '../../services/api'`).
  Nunca importes `http` ni `axios` fuera de `services/api`.
- Un endpoint nuevo = función en `services/api/<recurso>.ts` + tipos en `src/types/<recurso>.ts` + fila en `docs/api.md`.
- Los errores se distinguen por `errorCode` (`getDomainError(e)?.errorCode === 'INSUFFICIENT_STOCK'`), nunca por el texto de `message`.
  Los textos que ve el usuario los escribe el frontend.
- Toda pantalla que llama a la API maneja tres estados: cargando, error y vacío.
- Para leer datos usa `useQuery(key, (signal) => getX(..., { signal }))` de `src/hooks/useQuery.ts`: cancela la petición
  anterior y conserva los datos previos mientras carga (atenúa la lista con `opacity-60` en lugar de mostrar el esqueleto otra vez).
  `key` debe incluir todo lo que cambia la petición.
- La página actual y la búsqueda de una lista viven en la URL (`?pagina=2&buscar=pin`) para que funcione el botón atrás.

### Dinero (D4, D15)
- La API solo habla en **centavos enteros**. Convierte con `pesosToCents` al enviar y muestra con `formatCents`.
- Nunca guardes pesos con decimales en el estado que se manda a la API.
- `lineTotalCents` es el importe **total del renglón**. En una venta se puede sugerir `priceCents * quantity`, pero el usuario lo puede cambiar.

### Movimientos
- Inmutables (D11): no hay botones de editar ni borrar. Las correcciones son un `ADJUSTMENT` con `direction`.
- Manda `direction` solo en `ADJUSTMENT`. `quantity` siempre positiva. Valida los renglones en el formulario:
  la API todavía no lo hace (ver "Discrepancias conocidas" en `docs/api.md`).

### Idioma
- Código en **inglés** (componentes, funciones, variables, tipos, archivos nuevos).
- Texto visible en la UI y documentación en **español**. Rutas visibles en español (`/movimientos`, `/inventario`).
- Usa los términos del glosario de `modelo-de-datos.md`: Venta, Reabastecimiento, Devolución, Merma, Ajuste.

### Componentes
- Componentes de función con *named export*. Un componente reutilizable por archivo en `components/`.
- No declares componentes dentro de otros componentes (se recrean en cada render); súbelos al nivel del módulo.
- Lee `docs/styles.md` antes de crear o cambiar UI. Solo tokens del sistema: nada de hex sueltos, degradados ni
  interacciones que dependan de *hover*; todo objetivo táctil mide al menos 48 px (`min-h-touch`).

### Guía de estilos visual (temporal)
- `/estilos` (solo en desarrollo) muestra `docs/styles.md` con sus tokens y demos. Código en `src/pages/estilos/`.
- El texto, las tablas, los swatches y los contrastes se leen solos del `.md` y de `src/styles.css`. Los demos
  interactivos (`src/pages/estilos/demos.tsx`) no: **si cambias un patrón de la sección 6 o agregas/renumeras
  secciones, actualiza su demo en el mismo cambio.**
- Cuando el usuario pida eliminarla, sigue los pasos del comentario al inicio de `src/pages/estilos/index.tsx`.

## Comandos

Siempre a través de Nx desde la raíz del repo:

```sh
pnpm nx serve web        # http://localhost:4200
pnpm nx typecheck web
pnpm nx run web:eslint:lint
pnpm nx build web
```

La API debe estar corriendo (`pnpm nx start:dev orders-api`, puerto 3000) y `apps/web/.env` debe definir `VITE_API_URL`.
Antes de dar una tarea por terminada, corre `typecheck` y `eslint:lint`.
