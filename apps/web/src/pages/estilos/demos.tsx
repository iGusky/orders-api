import { useEffect, useState, type ReactNode } from 'react';
import {
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  History,
  House,
  Loader2,
  Minus,
  PackagePlus,
  PackageSearch,
  Plus,
  ShoppingBag,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react';
import { formatCents, pesosToCents } from '../../utils/money';

// Demos escritos a mano para los patrones de docs/styles.md, indexados por número de sección.
// Si cambias un patrón en el documento, actualiza aquí su demo.

const buttonPrimary =
  'h-touch-lg rounded-md bg-primary px-5 text-lg font-semibold text-on-primary active:bg-primary-pressed disabled:opacity-50';
const buttonSecondary =
  'h-touch rounded-md border border-line bg-surface px-4 font-semibold active:bg-primary-soft disabled:opacity-50';
const iconButton = 'grid size-touch place-items-center rounded-full active:bg-primary-soft';

function Demo({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-line p-4">
      <p className="text-sm text-ink-muted">{title}</p>
      {children}
    </div>
  );
}

// ---------- 3. Tipografía ----------

function TypographyDemo() {
  return (
    <Demo title="Pesos y cifras">
      <div className="flex flex-wrap gap-6 text-lg">
        <span className="font-normal">Normal 400</span>
        <span className="font-semibold">Semibold 600</span>
        <span className="font-bold">Bold 700</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-ink-muted">Proporcional</p>
          <p className="text-lg">$1,111.11<br />$8,888.88</p>
        </div>
        <div>
          <p className="text-sm text-ink-muted">Con tabular</p>
          <p className="tabular text-lg">$1,111.11<br />$8,888.88</p>
        </div>
      </div>
      <p className="text-sm text-ink-muted">Caracteres que se confunden: 1 l I | 0 O | 5 S | 8 B</p>
    </Demo>
  );
}

// ---------- 4. Elevación ----------

function ElevationDemo() {
  return (
    <Demo title="Plano frente a flotante">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-5">Tarjeta: plana, solo borde</div>
        <div className="rounded-lg bg-surface p-5 shadow-float">Flotante: shadow-float (hojas, toasts)</div>
      </div>
    </Demo>
  );
}

// ---------- 5 y 6.8. Layout y navegación ----------

const navItems: { label: string; icon: LucideIcon }[] = [
  { label: 'Inicio', icon: House },
  { label: 'Vender', icon: ShoppingBag },
  { label: 'Stock', icon: PackagePlus },
  { label: 'Movimientos', icon: History },
  { label: 'Inventario', icon: Boxes },
];

function BottomNav({ active, onSelect }: { active: string; onSelect: (label: string) => void }) {
  return (
    <nav aria-label="Principal" className="grid h-nav grid-cols-5 border-t border-line bg-surface">
      {navItems.map(({ label, icon: Icon }) => {
        const isActive = label === active;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-1 text-sm ${isActive ? 'text-primary' : 'text-ink-muted'}`}
          >
            <span className={`grid h-8 w-14 place-items-center rounded-full ${isActive ? 'bg-primary-soft' : ''}`}>
              <Icon className="size-6" aria-hidden />
            </span>
            <span className="max-w-full truncate px-1 text-[0.75rem]">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function SideRail({ active, onSelect }: { active: string; onSelect: (label: string) => void }) {
  return (
    <nav aria-label="Principal" className="flex w-28 flex-col gap-2 border-r border-line bg-surface p-2">
      {navItems.map(({ label, icon: Icon }) => {
        const isActive = label === active;
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(label)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-touch flex-col items-center justify-center gap-1 rounded-md py-2 text-[0.75rem] ${isActive ? 'bg-primary-soft text-primary' : 'text-ink-muted'}`}
          >
            <Icon className="size-6" aria-hidden />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

function LayoutDemo() {
  const [active, setActive] = useState('Vender');
  return (
    <div className="flex flex-col gap-4">
      <Demo title="Celular: contenido, barra de acción fija y navegación inferior">
        <div className="mx-auto flex h-[40rem] w-full max-w-[24rem] flex-col overflow-hidden rounded-xl border border-line bg-background">
          <header className="flex items-center gap-2 px-2 pt-3">
            <button type="button" className={iconButton} aria-label="Volver">
              <ChevronLeft className="size-6" aria-hidden />
            </button>
            <h3 className="text-xl">Registrar venta</h3>
          </header>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
            <ProductRow name="Sticker de nopal" priceCents={900} stock={24} />
            <ProductRow name="Paquete de 5 stickers" priceCents={4500} stock={2} />
            <ProductRow name="Llavero de barro" priceCents={6000} stock={0} />
          </div>
          <div className="bg-surface p-3 shadow-float">
            <button type="button" className={`${buttonPrimary} w-full`}>Registrar venta</button>
          </div>
          <BottomNav active={active} onSelect={setActive} />
        </div>
      </Demo>

      <Demo title="iPad: riel lateral y dos columnas">
        <div className="flex h-[26rem] overflow-hidden rounded-lg border border-line bg-background">
          <SideRail active={active} onSelect={setActive} />
          <div className="grid flex-1 grid-cols-[2fr_3fr] gap-4 p-4">
            <div className="flex flex-col gap-3 overflow-y-auto">
              <ProductRow name="Sticker de nopal" priceCents={900} stock={24} />
              <ProductRow name="Paquete de 5 stickers" priceCents={4500} stock={2} />
            </div>
            <div className="rounded-lg border border-line bg-surface p-4">
              <h3 className="text-xl">Sticker de nopal</h3>
              <p className="tabular mt-1 flex gap-3 text-sm text-ink-muted"><span>{formatCents(900)}</span><span>24 en stock</span></p>
            </div>
          </div>
        </div>
      </Demo>
    </div>
  );
}

function NavigationDemo() {
  const [active, setActive] = useState('Inicio');
  return (
    <Demo title="Barra inferior (toca para cambiar el destino activo)">
      <div className="overflow-hidden rounded-lg border border-line">
        <BottomNav active={active} onSelect={setActive} />
      </div>
    </Demo>
  );
}

// ---------- 6.1 Botones ----------

function ButtonsDemo() {
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!saving) return;
    const timeout = setTimeout(() => setSaving(false), 2000);
    return () => clearTimeout(timeout);
  }, [saving]);

  return (
    <Demo title="Estados">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button type="button" className={`${buttonPrimary} flex w-full items-center justify-center gap-2 sm:w-auto`} disabled={saving} onClick={() => setSaving(true)}>
          {saving && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {saving ? 'Guardando…' : 'Guardar (toca para ver la carga)'}
        </button>
        <button type="button" className={`${buttonSecondary} w-full sm:w-auto`} disabled>Deshabilitado</button>
      </div>
      <p className="flex items-center gap-1 text-sm text-ink-muted">
        <CircleAlert className="size-4" aria-hidden />
        Agrega al menos un producto para continuar.
      </p>
    </Demo>
  );
}

// ---------- 6.2 Campos ----------

function FieldsDemo() {
  const [amount, setAmount] = useState('45.50');
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const cents = pesosToCents(amount);
  const nameError = touched && name.trim() === '';

  return (
    <Demo title="Campos">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="font-semibold">Importe cobrado</span>
          <span className="flex min-h-touch items-center rounded-md border border-line bg-surface px-4 focus-within:outline-3 focus-within:outline-primary">
            <span className="text-ink-muted" aria-hidden>$</span>
            <input
              className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </span>
          <span className="tabular text-sm text-ink-muted">
            {Number.isNaN(cents) ? 'Escribe un número' : `Se envía como ${cents} centavos (${formatCents(cents)})`}
          </span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-semibold">Nombre del producto</span>
          <input
            className={`min-h-touch rounded-md border bg-surface px-4 ${nameError ? 'border-danger' : 'border-line'}`}
            value={name}
            placeholder="Sticker de nopal"
            aria-invalid={nameError}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          {nameError && (
            <span className="flex items-center gap-1 text-sm text-danger">
              <CircleAlert className="size-4" aria-hidden />
              Escribe el nombre del producto.
            </span>
          )}
        </label>
      </div>
    </Demo>
  );
}

// ---------- 6.3 Stepper ----------

function QuantityStepper({ value, max, onChange }: { value: number; max: number; onChange: (value: number) => void }) {
  const stepButton = 'grid size-touch-lg place-items-center rounded-full border border-line bg-surface active:bg-primary-soft disabled:opacity-50';
  return (
    <div className="flex items-center gap-4">
      <button type="button" className={stepButton} aria-label="Quitar uno" disabled={value <= 1} onClick={() => onChange(value - 1)}>
        <Minus className="size-6" aria-hidden />
      </button>
      <span className="tabular w-12 text-center text-xl font-semibold" aria-live="polite">{value}</span>
      <button type="button" className={stepButton} aria-label="Agregar uno" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus className="size-6" aria-hidden />
      </button>
    </div>
  );
}

function StepperDemo() {
  const stock = 3;
  const [quantity, setQuantity] = useState(1);
  return (
    <Demo title={`Salida con ${stock} en stock`}>
      <QuantityStepper value={quantity} max={stock} onChange={setQuantity} />
      {quantity >= stock && (
        <p className="w-fit rounded-sm bg-kraft px-2 text-sm text-kraft-ink">Son todos los que quedan</p>
      )}
    </Demo>
  );
}

// ---------- 6.4 Listas ----------

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="rounded-sm bg-danger-soft px-2 text-sm text-danger">Agotado</span>;
  if (stock <= 3) return <span className="rounded-sm bg-kraft px-2 text-sm text-kraft-ink">Quedan {stock}</span>;
  return null;
}

function ProductRow({ name, priceCents, stock }: { name: string; priceCents: number; stock: number }) {
  return (
    <button type="button" className="flex min-h-16 w-full items-center gap-3 rounded-md border border-line bg-surface px-4 py-2 text-left active:bg-primary-soft">
      <span className="flex flex-1 flex-col">
        <span className="text-lg">{name}</span>
        <span className="tabular flex gap-3 text-sm text-ink-muted">
          <span>{formatCents(priceCents)}</span>
          <span>{stock} en stock</span>
        </span>
      </span>
      <StockBadge stock={stock} />
      <ChevronRight className="size-5 text-ink-muted" aria-hidden />
    </button>
  );
}

function ListsDemo() {
  return (
    <Demo title="Productos: normal, stock bajo y agotado">
      <div className="flex flex-col gap-3">
        <ProductRow name="Sticker de nopal" priceCents={900} stock={24} />
        <ProductRow name="Paquete de 5 stickers" priceCents={4500} stock={2} />
        <ProductRow name="Llavero de barro" priceCents={6000} stock={0} />
      </div>
    </Demo>
  );
}

// ---------- 6.5 Movimientos ----------

function MovementRow({ icon: Icon, type, date, quantity, amountCents }: { icon: LucideIcon; type: string; date: string; quantity: string; amountCents: number }) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-md border border-line bg-surface px-4 py-2">
      <Icon className="size-5 shrink-0 text-ink-muted" aria-hidden />
      <span className="flex flex-1 flex-col">
        <span>{type} <span className="tabular font-semibold">{quantity}</span></span>
        <span className="text-sm text-ink-muted">{date}</span>
      </span>
      {amountCents > 0 && <span className="tabular font-semibold">{formatCents(amountCents)}</span>}
    </div>
  );
}

function MovementsDemo() {
  return (
    <Demo title="Lista de movimientos">
      <div className="flex flex-col gap-3">
        <MovementRow icon={ShoppingBag} type="Venta" date="29 oct, 14:30" quantity="−5" amountCents={4500} />
        <MovementRow icon={PackagePlus} type="Reabastecimiento" date="29 oct, 09:10" quantity="+12" amountCents={0} />
        <MovementRow icon={SlidersHorizontal} type="Ajuste" date="28 oct, 19:45" quantity="+45" amountCents={0} />
      </div>
    </Demo>
  );
}

// ---------- 6.6 Etiqueta kraft ----------

function KraftTagDemo() {
  const [quantity, setQuantity] = useState(5);
  const unitPriceCents = 1000;
  const listCents = unitPriceCents * quantity;
  const chargedCents = 4500;
  const diff = chargedCents - listCents;

  return (
    <Demo title="Captura de venta (cambia la cantidad)">
      <QuantityStepper value={quantity} max={20} onChange={setQuantity} />
      <div className="max-w-sm rounded-lg bg-kraft p-5 text-ink">
        <p className="flex items-center gap-3">
          <span className="size-3 shrink-0 rounded-full border border-line bg-background" aria-hidden />
          {quantity} × Sticker
        </p>
        <p className="tabular mt-4 font-display text-amount">{formatCents(chargedCents)}</p>
        <p className="tabular mt-2 text-sm text-kraft-ink">
          Precio de lista: {formatCents(listCents)}
          {diff !== 0 && ` (${diff > 0 ? '+' : '−'}${formatCents(Math.abs(diff))})`}
        </p>
      </div>
    </Demo>
  );
}

// ---------- 6.7 Hoja inferior ----------

function BottomSheetDemo() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <Demo title="Elegir producto">
      <button type="button" className={`${buttonSecondary} w-fit`} onClick={() => setOpen(true)}>Abrir hoja</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <button type="button" className="absolute inset-0 bg-ink/30" aria-label="Cerrar" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            className="relative flex max-h-[85dvh] w-full max-w-lg flex-col gap-4 rounded-t-xl bg-surface p-4 pb-safe shadow-float transition-transform duration-200 ease-out starting:translate-y-full md:rounded-lg md:starting:translate-y-8"
          >
            <span className="mx-auto h-1 w-10 rounded-full bg-line md:hidden" aria-hidden />
            <div className="flex items-center justify-between">
              <h3 id="sheet-title" className="text-xl">Elige un producto</h3>
              <button type="button" className={iconButton} aria-label="Cerrar" onClick={() => setOpen(false)}>
                <X className="size-6" aria-hidden />
              </button>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto pb-4">
              <ProductRow name="Sticker de nopal" priceCents={900} stock={24} />
              <ProductRow name="Paquete de 5 stickers" priceCents={4500} stock={2} />
            </div>
          </div>
        </div>
      )}
    </Demo>
  );
}

// ---------- 6.9 Estados ----------

const states = ['Cargando', 'Vacío', 'Error', 'Con datos'] as const;

function StatesDemo() {
  const [state, setState] = useState<(typeof states)[number]>('Cargando');
  const [toast, setToast] = useState(false);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(false), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);

  return (
    <Demo title="Estados de una lista">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Estado">
        {states.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={state === s}
            onClick={() => setState(s)}
            className={`min-h-touch rounded-full border px-4 ${state === s ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {state === 'Cargando' && (
        <div className="flex flex-col gap-3" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-md bg-line/50" />)}
        </div>
      )}
      {state === 'Vacío' && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <PackageSearch className="size-10 text-ink-muted" aria-hidden />
          <p>Todavía no tienes productos.</p>
          <button type="button" className={buttonPrimary}>Agregar producto</button>
        </div>
      )}
      {state === 'Error' && (
        <div className="flex gap-3 rounded-lg bg-danger-soft p-4">
          <CircleAlert className="size-6 shrink-0 text-danger" aria-hidden />
          <div className="flex flex-col gap-3">
            <p>No se pudo cargar el inventario. Revisa tu conexión e inténtalo otra vez.</p>
            <button type="button" className={`${buttonSecondary} w-fit`}>Reintentar</button>
          </div>
        </div>
      )}
      {state === 'Con datos' && <ProductRow name="Sticker de nopal" priceCents={900} stock={24} />}

      <button type="button" className={`${buttonSecondary} w-fit`} onClick={() => setToast(true)}>Mostrar toast</button>
      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-sm items-center gap-2 rounded-md bg-ink px-4 py-3 text-surface shadow-float transition-transform duration-200 ease-out starting:translate-y-4">
          <Check className="size-5" aria-hidden />
          Venta registrada
        </div>
      )}
    </Demo>
  );
}

// ---------- 7. Iconos ----------

function IconsDemo() {
  return (
    <Demo title="Tamaños: 20, 24 y 40 px">
      <div className="flex items-end gap-6 text-ink">
        <ShoppingBag className="size-5" aria-hidden />
        <ShoppingBag className="size-6" aria-hidden />
        <ShoppingBag className="size-10 text-ink-muted" aria-hidden />
        <button type="button" className={iconButton} aria-label="Cerrar">
          <X className="size-6" aria-hidden />
        </button>
      </div>
    </Demo>
  );
}

export const demos: Record<string, () => ReactNode> = {
  '3': TypographyDemo,
  '4/Elevación': ElevationDemo,
  '5': LayoutDemo,
  '6.1': ButtonsDemo,
  '6.2': FieldsDemo,
  '6.3': StepperDemo,
  '6.4': ListsDemo,
  '6.5': MovementsDemo,
  '6.6': KraftTagDemo,
  '6.7': BottomSheetDemo,
  '6.8': NavigationDemo,
  '6.9': StatesDemo,
  '7': IconsDemo,
};
