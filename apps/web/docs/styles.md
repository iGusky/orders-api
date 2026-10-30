# Guía de estilos

> Sistema visual del frontend. Los valores viven como tokens en [`src/styles.css`](../src/styles.css) (`@theme` de Tailwind v4);
> este documento explica **cuándo** usar cada uno. Si cambias un token, actualiza la tabla correspondiente aquí.

Última actualización: 2026-10-30 (detalle de movimientos)

---

## 1. Concepto: el puesto del bazar

La app se usa de pie, en un bazar, con una mano y muchas veces con prisa. El diseño toma sus materiales de ese lugar:
piso de **arena**, macetas de **terracota**, etiquetas de **papel kraft** y **arcilla**. Colores tierra, apagados, que no compiten
con la mercancía ni cansan la vista con luz de día.

Principios:

1. **Dedo antes que puntero.** Nada depende de *hover*. Todo objetivo táctil mide al menos 48 px y las acciones frecuentes
   quedan al alcance del pulgar (parte inferior de la pantalla).
2. **Una acción principal por pantalla.** Solo un elemento terracota sólido por vista. Lo demás es superficie o contorno.
3. **El color informa, no decora.** Terracota = acción o selección. Vino = error o algo que impide continuar. Kraft = dinero
   y avisos de stock bajo. Si un color no comunica nada, la pieza va en neutros.
4. **Lo importante es la cifra.** Cantidades e importes se leen de un vistazo: grandes, con números tabulares y sin adornos.
5. **Plano y tranquilo.** Sin degradados, neones, brillos (*bloom*), *glassmorphism* ni sombras decorativas.

El elemento memorable es uno solo: la **etiqueta kraft** que muestra el importe al registrar un movimiento (ver 6.6).
Todo lo demás se mantiene sobrio.

---

## 2. Color

Tokens semánticos: el nombre dice **para qué** sirve el color, no cuál es. Para cambiar la paleta, edita solo los hex en
`src/styles.css`; ningún componente debe usar un hex directo. La paleta por defecto de Tailwind (`gray-*`, `red-*`, …)
está **desactivada**: si una clase como `bg-gray-100` no hace nada, es a propósito.

| Token (`bg-*`, `text-*`, `border-*`) | Hex       | Nombre    | Uso                                                       |
|--------------------------------------|-----------|-----------|-----------------------------------------------------------|
| `background`                         | `#eee7df` | Arena     | Fondo de la app                                           |
| `surface`                            | `#f9f5f0` | Papel     | Tarjetas, filas, inputs, barra de navegación, hojas        |
| `line`                               | `#dbcfc3` | Arcilla   | Bordes y divisores                                        |
| `ink`                                | `#33291f` | Carbón    | Texto principal                                           |
| `ink-muted`                          | `#6e5f54` | Tierra    | Texto secundario, iconos inactivos, *placeholders*        |
| `primary`                            | `#94523d` | Terracota | Botón principal, selección activa, foco                    |
| `primary-pressed`                    | `#7a4331` |           | Estado presionado del botón principal                     |
| `primary-soft`                       | `#f3e2d8` |           | Fondo de elementos seleccionados o presionados (secundarios) |
| `on-primary`                         | `#f9f5f0` |           | Texto e iconos sobre `primary`                            |
| `danger`                             | `#7a3341` | Vino      | Errores, stock insuficiente, acciones destructivas         |
| `danger-soft`                        | `#efd7db` |           | Fondo de avisos de error                                  |
| `kraft`                              | `#ebdcc0` | Kraft     | Etiqueta del importe, aviso de stock bajo                  |
| `kraft-ink`                          | `#715428` |           | Texto sobre `kraft` cuando no es `ink`                    |

Combinaciones verificadas (contraste WCAG AA, ≥ 4.5:1 para texto normal):

- `ink` sobre `background`, `surface` y `kraft`.
- `ink-muted` sobre `background` y `surface`. Evítalo en `kraft` (4.5:1, justo en el límite): ahí usa `kraft-ink`.
- `on-primary` sobre `primary` y `primary-pressed`.
- `primary` sobre `surface` y `primary-soft`.
- `danger` sobre `surface` y `danger-soft`.
- `kraft-ink` sobre `kraft`.

Si cambias un hex, vuelve a verificar estas combinaciones.

Reglas:

- El color **nunca** es la única señal: un error lleva icono y texto, una selección lleva check o borde.
- Las ventas **no** son rojas. Que un movimiento reste stock no lo vuelve negativo; la dirección se indica con icono (6.5).
- `primary` (terracota) y `danger` (vino) son vecinos en el círculo cromático. Para no confundirlos: el error siempre
  lleva `CircleAlert` y texto, y nunca se usa `danger` en un botón sólido; las acciones destructivas son botones secundarios con `text-danger`.
- No hay modo oscuro por ahora. Si se agrega, se hace redefiniendo estos mismos tokens.

---

## 3. Tipografía

Dos familias, autoalojadas con Fontsource (funcionan sin internet en el bazar). El brief permite tres; la tercera se
deja libre a propósito para no saturar.

| Clase          | Familia                         | Rol                                                     |
|----------------|---------------------------------|---------------------------------------------------------|
| `font-sans`    | Atkinson Hyperlegible Next      | Toda la interfaz: texto, botones, inputs, cifras         |
| `font-display` | Young Serif                     | Títulos de pantalla (`h1`–`h3`) y el importe de la etiqueta |

- **Atkinson Hyperlegible Next** se diseñó para distinguir caracteres parecidos (`1 l I`, `0 O`, `5 S`). Eso importa al
  leer cantidades y precios rápido. Es la fuente por defecto del `body`.
- **Young Serif** tiene un solo peso (400) y recuerda a un letrero de mercado pintado a mano. Úsala solo en tamaños
  `text-lg` o mayores; nunca en párrafos, botones pequeños ni etiquetas de formulario. Los `h1`–`h3` ya la usan por defecto.

Escala (17 px de base; los inputs nunca bajan de 16 px para evitar el zoom automático de iOS):

| Clase         | Tamaño | Interlínea | Uso                                               |
|---------------|--------|------------|---------------------------------------------------|
| `text-sm`     | 14 px  | 1.4        | Ayudas bajo un campo, fecha y hora, metadatos      |
| `text-base`   | 17 px  | 1.5        | Texto, inputs, filas de lista                      |
| `text-lg`     | 20 px  | 1.35       | Nombre de producto, botones principales            |
| `text-xl`     | 24 px  | 1.25       | Título de pantalla                                 |
| `text-2xl`    | 32 px  | 1.15       | Título de inicio                                   |
| `text-amount` | 44 px  | 1          | Importe en la etiqueta kraft                       |

Pesos de `font-sans`: `font-normal` (400) para texto, `font-semibold` (600) para botones y cifras destacadas,
`font-bold` (700) con moderación. No uses pesos menores a 400: pierden legibilidad al sol.

Reglas:

- Cifras que se comparan o se alinean en columna llevan la utilidad `tabular` (números del mismo ancho).
- Mayúscula solo al inicio de la frase: "Registrar venta", no "REGISTRAR VENTA" ni "Registrar Venta".
- Sin etiquetas pequeñas en mayúsculas encima de los títulos, ni una palabra resaltada en otro color o en cursiva.
- Largo de línea máximo ~70 caracteres (`max-w-prose` o el contenedor de la pantalla).

---

## 4. Forma, espacio y elevación

### Radios

La esquina crece con el tamaño del elemento. No uses el mismo radio para todo:

| Clase          | Radio  | Uso                                                 |
|----------------|--------|-----------------------------------------------------|
| `rounded-sm`   | 8 px   | Badges, chips dentro de una fila                     |
| `rounded-md`   | 14 px  | Botones, inputs, filas de lista                      |
| `rounded-lg`   | 20 px  | Paneles, tarjetas, la etiqueta kraft                 |
| `rounded-t-xl` | 28 px  | Esquinas superiores de hojas inferiores (*bottom sheets*) |
| `rounded-full` | —      | Botones de solo icono, steppers, chips de filtro     |

### Espacio

- Escala de Tailwind (múltiplos de 4 px). Margen lateral de pantalla: `px-4` en celular y `px-6` en iPad (`md:px-6`).
- Separación mínima entre dos objetivos táctiles: `gap-3` (12 px). Nunca pongas dos botones pegados.
- Dentro de una tarjeta o panel: `p-4`/`p-5`. Entre secciones de una pantalla: `gap-6`.

### Tacto

| Clase                          | Medida | Uso                                                      |
|--------------------------------|--------|----------------------------------------------------------|
| `h-touch` / `min-h-touch` / `size-touch` | 48 px | Mínimo para **cualquier** cosa tocable: botón, fila, input, icono |
| `h-touch-lg` / `size-touch-lg` | 56 px  | Acción principal, botones del stepper de cantidad         |
| `h-nav`                        | 72 px  | Barra de navegación inferior                              |

Un icono de 20 px puede verse pequeño, pero su área tocable debe medir 48 px (`size-touch` en el botón que lo envuelve).

### Elevación

- Por defecto todo es **plano**: la jerarquía se hace con `bg-surface` sobre `bg-background` y bordes `border-line`.
- `shadow-float` es la única sombra y solo se usa en lo que flota sobre el contenido: hojas inferiores, barra de acción
  fija y toasts. Tarjetas y filas **no** llevan sombra.

---

## 5. Layout

### Celular (vertical, < 768 px): diseño base

```
┌──────────────────────────┐
│ Título de pantalla       │  ← h1 font-display, alineado a la izquierda
│                          │
│ contenido con scroll     │
│ (listas, formularios)    │
│                          │
├──────────────────────────┤
│ [   Acción principal   ] │  ← barra fija, shadow-float, dentro del alcance del pulgar
├──────────────────────────┤
│  Inicio  Vender  Stock   │  ← nav inferior, icono + texto, h-nav, pb-safe
└──────────────────────────┘
```

### iPad (≥ 768 px, `md:`)

```
┌────────┬──────────────────────────────────────┐
│ Inicio │ Título                               │
│ Vender │ ┌──────────────┐ ┌─────────────────┐ │
│ Stock  │ │ lista        │ │ detalle / form  │ │
│ Movs.  │ │              │ │                 │ │
│ Inv.   │ └──────────────┘ └─────────────────┘ │
└────────┴──────────────────────────────────────┘
  ↑ riel lateral (icono + texto) en lugar de la barra inferior
```

- En iPad la lista y el formulario pueden convivir en dos columnas (`md:grid md:grid-cols-[2fr_3fr]`).
- El contenido nunca pasa de `max-w-5xl`; en escritorio se centra y no se estira más.
- Contenido **alineado a la izquierda**. Solo se centran los estados vacíos y las confirmaciones.
- Respeta las áreas seguras del dispositivo con las utilidades `pt-safe` y `pb-safe` (el viewport usa `viewport-fit=cover`).

---

## 6. Componentes

Patrones a seguir al construir. Cuando un patrón se repita en dos pantallas, extráelo a `src/components/`.

### 6.1 Botones

| Variante   | Clases base                                                                 | Uso                          |
|------------|-----------------------------------------------------------------------------|------------------------------|
| Principal  | `h-touch-lg rounded-md bg-primary px-5 text-lg font-semibold text-on-primary active:bg-primary-pressed` | Una por pantalla: Guardar, Registrar venta |
| Secundario | `h-touch rounded-md border border-line bg-surface px-4 font-semibold active:bg-primary-soft` | Cancelar, acciones alternas |
| Peligro    | Igual que secundario con `text-danger`                                      | Quitar un renglón, descartar  |
| Icono      | `size-touch rounded-full grid place-items-center active:bg-primary-soft` + `aria-label` | Cerrar, más, menos |

- El estado se comunica con `active:` (al tocar), no con `hover:`. Puedes agregar `hover:` como extra, nunca como única señal.
- Deshabilitado: `disabled:opacity-50`, y explica junto al botón por qué no se puede continuar.
- Mientras se envía: el botón muestra un `Loader2` girando, cambia el texto ("Guardando…") y queda deshabilitado para evitar dobles envíos.
- Botones de ancho completo en celular (`w-full md:w-auto`).

### 6.2 Campos de formulario

- `min-h-touch rounded-md border border-line bg-surface px-4 text-base`, foco con el outline global (`:focus-visible`).
- La etiqueta va **arriba** del campo, siempre visible (no uses el *placeholder* como etiqueta).
- Montos: `inputMode="decimal"`, prefijo `$` visual fuera del valor y conversión con `pesosToCents` al enviar.
- Cantidades: `inputMode="numeric"` combinado con el stepper (6.3).
- Error: borde `border-danger`, texto `text-sm text-danger` debajo con icono `CircleAlert`, y `aria-invalid`.

### 6.3 Stepper de cantidad

Para cantidades, el usuario toca, no teclea:

```
 ( − )     5     ( + )
```

- Botones `size-touch-lg rounded-full border border-line bg-surface` con iconos `Minus` / `Plus`.
- El número en `text-xl font-semibold tabular`, y se puede tocar para escribirlo directamente.
- El mínimo es 1 (`quantity > 0`). En una salida, el máximo es el stock disponible, y al llegar a él se muestra el aviso de stock.

### 6.4 Listas y filas

- Fila: `min-h-16 rounded-md border border-line bg-surface px-4` con icono a la izquierda y valor o chevron a la derecha.
  Toda la fila es tocable, no solo el texto.
- Las filas se separan con `gap-2`/`gap-3`, no con divisores finos.
- Producto: nombre en `text-lg`, precio y stock en `text-sm text-ink-muted tabular`.
- Stock bajo: badge `rounded-sm bg-kraft px-2 text-sm text-kraft-ink` ("Quedan 2"). Sin stock: badge `bg-danger-soft text-danger` ("Agotado").

### 6.5 Movimientos

La dirección se comunica con icono y signo, en tinta neutra. Nunca con verde y rojo, ni con terracota o vino:

| Tipo         | Icono lucide          | Texto            | Cantidad |
|--------------|-----------------------|------------------|----------|
| `SALE`       | `ShoppingBag`         | Venta            | −5       |
| `RESTOCK`    | `PackagePlus`         | Reabastecimiento | +12      |
| `RETURN`     | `Undo2`               | Devolución       | +1       |
| `SHRINKAGE`  | `PackageX`            | Merma            | −2       |
| `ADJUSTMENT` | `SlidersHorizontal`   | Ajuste           | ±n según `direction` |

- Fila: icono, tipo y fecha (`occurredAt`, formato corto "29 oct, 14:30") y número de productos ("3 productos") a la izquierda; importe con `formatCents` a la derecha.
  Si el importe es `0`, no se muestra.
- Acordeón: toda la fila es tocable, con `ChevronDown` a la derecha que gira al abrir. Debajo se despliegan los renglones
  (producto, cantidad con signo e importe); solo un movimiento abierto a la vez.
- Sin botones de editar ni borrar (D11). Para corregir se ofrece "Registrar ajuste".

### 6.6 Etiqueta kraft (elemento distintivo)

Resume el movimiento que se está capturando, como la etiqueta de precio amarrada a un producto:

```
┌───────────────────────────────┐
│ ○  5 × Sticker                │  ← text-base, el círculo evoca la perforación del cordón
│                               │
│    $45.00                     │  ← font-display text-amount tabular
│    Precio de lista: $50.00    │  ← text-sm text-kraft-ink
└───────────────────────────────┘
```

- `rounded-lg bg-kraft p-5 text-ink`. La perforación es un círculo de 12 px `bg-background` con borde `border-line`.
- Se usa **solo** en la captura de venta o devolución (pantallas con dinero). No la reutilices como tarjeta genérica.
- Cuando el importe difiere de `priceCents × quantity`, la línea de precio de lista indica la diferencia; no se oculta ni se corrige sola.

### 6.7 Hojas inferiores (*bottom sheets*)

- Para elegir un producto, confirmar o capturar un renglón sin salir de la pantalla.
- `rounded-t-xl bg-surface shadow-float pb-safe`, agarradera de 40 × 4 px `bg-line rounded-full` arriba al centro.
- Fondo detrás: `bg-ink/30` (sin desenfoque). Se cierra tocando el fondo, deslizando hacia abajo o con el botón `X`.
- En iPad se muestra como panel lateral o diálogo centrado (`md:rounded-lg`).

### 6.8 Navegación

- Celular: barra inferior fija `h-nav bg-surface border-t border-line pb-safe` con 4–5 destinos. Cada destino es icono
  (24 px) **y** texto (`text-sm`); el activo usa `text-primary` y un fondo `bg-primary-soft rounded-full` detrás del icono.
- iPad: riel lateral con los mismos destinos.
- Volver: botón icono `ChevronLeft` arriba a la izquierda. No dependas de gestos del navegador.

### 6.9 Avisos y estados

| Estado    | Tratamiento                                                                                       |
|-----------|---------------------------------------------------------------------------------------------------|
| Cargando  | Filas fantasma `bg-line/50 rounded-md` con la forma del contenido. Sin *spinners* a pantalla completa |
| Vacío     | Centrado: icono lucide 40 px `text-ink-muted`, una frase y el botón para crear lo que falta        |
| Error     | Panel `rounded-lg bg-danger-soft p-4` con `CircleAlert`, qué pasó, qué hacer y botón "Reintentar"   |
| Éxito     | Toast abajo, sobre la barra de acción: `rounded-md bg-ink text-surface shadow-float`, 3 s, con `Check` |

---

## 7. Iconos

- Solo **`lucide-react`**. No mezcles otras librerías ni SVG sueltos sin preguntar.
- Tamaños: 20 px (`size-5`) dentro de filas y campos, 24 px (`size-6`) en navegación y botones, 32–40 px en estados vacíos.
- Grosor por defecto (`strokeWidth={2}`). Color heredado del texto (`currentColor`).
- Los iconos decorativos llevan `aria-hidden`. Un botón de solo icono lleva `aria-label` en español.
- En la navegación, un icono nunca va sin texto.

---

## 8. Movimiento

- Solo animaciones que responden a lo que hizo el usuario: abrir una hoja (deslizar desde abajo, 200 ms, `ease-out`),
  confirmar (el toast entra desde abajo), expandir.
- Nada se anima solo al cargar una pantalla. Sin efectos de entrada por sección.
- `prefers-reduced-motion` ya se respeta de forma global en `styles.css`.

---

## 9. Textos de la interfaz

- Todo en **español** (México), tuteando: "Registra tu primera venta".
- Usa los términos del glosario de `apps/api/docs/modelo-de-datos.md`: Venta, Reabastecimiento, Devolución, Merma, Ajuste, Stock.
- Un botón dice exactamente lo que hace, y la confirmación repite el mismo verbo: "Registrar venta" → "Venta registrada".
- Errores: qué pasó y cómo resolverlo, sin disculpas ni vaguedades.
  - ✅ "Solo quedan 3 stickers. Cambia la cantidad o registra un reabastecimiento."
  - ❌ "Lo sentimos, ocurrió un error."
- Los textos de error los escribe el frontend a partir de `errorCode` (ver `docs/api.md`); no muestres el `message` de la API tal cual.
- Dinero con `formatCents` ("$45.00"); fechas con `Intl.DateTimeFormat('es-MX')`.
- Sin flechas `→` al final de los botones, sin separadores `·` para juntar datos y sin signos de exclamación de relleno.

---

## 10. Prohibido

- Degradados de cualquier tipo, colores neón, brillos/*bloom*, *glassmorphism*, desenfoques de fondo.
- Hex sueltos en componentes, o reactivar la paleta por defecto de Tailwind.
- Interacciones que solo existen con *hover* o con clic derecho.
- Objetivos táctiles menores a 48 px.
- Sombras en tarjetas y filas.
- Más de dos familias tipográficas sin actualizar este documento.
