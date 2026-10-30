import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown, CircleAlert, Loader2, PackageSearch, Search } from 'lucide-react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useQuery } from '../hooks/useQuery';
import { getProducts } from '../services/api';
import type { Product } from '../types/product';
import { StockBadge } from './StockBadge';

// Solo se pide la primera página; con más productos, el usuario filtra escribiendo.
const OPTIONS_PER_PAGE = 100;

interface ProductComboboxProps {
  label: string;
  value: Product | null;
  onChange: (product: Product | null) => void;
  error?: string;
  refreshKey?: number;   // cámbialo para volver a cargar las opciones (por ejemplo, después de guardar)
}

export function ProductCombobox({ label, value, onChange, error, refreshKey = 0 }: ProductComboboxProps) {
  const id = useId();
  const listId = `${id}-list`;
  const errorId = `${id}-error`;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const focusInputRef = useRef(false);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const search = useDebouncedValue(query.trim(), 300);
  const { status, data, refetch } = useQuery(`product-options:${search}:${refreshKey}`, (signal) =>
    getProducts({ page: 1, perPage: OPTIONS_PER_PAGE, search: search || undefined }, { signal }),
  );
  const options = data?.data ?? [];
  const searching = query.trim() !== search || status === 'loading';

  // Cierra la lista al tocar fuera del componente.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Después de "Cambiar", el campo de búsqueda aparece de nuevo y recibe el foco.
  useEffect(() => {
    if (!value && focusInputRef.current) {
      focusInputRef.current = false;
      inputRef.current?.focus();
    }
  }, [value]);

  const select = (product: Product) => {
    onChange(product);
    setOpen(false);
    setQuery('');
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();   // no enviar el formulario mientras se elige
      const option = options[activeIndex] ?? (options.length === 1 ? options[0] : undefined);
      if (option) select(option);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  if (value) {
    return (
      <div className="flex flex-col gap-1">
        <span className="font-semibold">{label}</span>
        <div className="flex min-h-16 items-center gap-3 rounded-md border border-primary bg-primary-soft px-4 py-2">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-lg">{value.name}</span>
            <span className="flex items-center gap-2 text-sm text-ink-muted">
              <span className="tabular">{value.stock} en stock</span>
              <StockBadge stock={value.stock} />
            </span>
          </span>
          <button
            type="button"
            className="h-touch shrink-0 rounded-md border border-line bg-surface px-4 font-semibold active:bg-background"
            onClick={() => {
              focusInputRef.current = true;
              onChange(null);
              setOpen(true);
            }}
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1">
      <label htmlFor={`${id}-input`} className="font-semibold">{label}</label>
      <div
        className={`flex min-h-touch items-center gap-2 rounded-md border bg-surface pl-4 focus-within:outline-3 focus-within:outline-primary ${error ? 'border-danger' : 'border-line'}`}
      >
        <Search className="size-5 shrink-0 text-ink-muted" aria-hidden />
        <input
          ref={inputRef}
          id={`${id}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeIndex >= 0 && options[activeIndex] ? `${id}-option-${options[activeIndex].id}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent py-2 outline-none"
          placeholder="Busca por nombre"
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Cerrar lista' : 'Abrir lista'}
          className="grid size-touch shrink-0 place-items-center rounded-full text-ink-muted active:bg-primary-soft"
          onClick={() => setOpen((o) => !o)}
        >
          {searching && open ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ChevronDown className={`size-5 ${open ? 'rotate-180' : ''}`} aria-hidden />}
        </button>
      </div>

      {error && !open && (
        <span id={errorId} className="flex items-center gap-1 text-sm text-danger">
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          {error}
        </span>
      )}

      {open && (
        <div className="mt-1 overflow-hidden rounded-md border border-line bg-surface">
          <p className="sr-only" aria-live="polite">
            {searching ? 'Buscando productos' : `${options.length} productos`}
          </p>

          {status === 'error' && (
            <div className="flex flex-col items-start gap-2 p-4">
              <p className="flex items-center gap-2"><CircleAlert className="size-5 text-danger" aria-hidden />No se pudieron cargar los productos.</p>
              <button type="button" onClick={refetch} className="h-touch rounded-md border border-line bg-surface px-4 font-semibold active:bg-primary-soft">
                Reintentar
              </button>
            </div>
          )}

          {status !== 'error' && !data && (
            <p className="flex items-center gap-2 p-4 text-ink-muted"><Loader2 className="size-5 animate-spin" aria-hidden />Cargando productos…</p>
          )}

          {status !== 'error' && data && options.length === 0 && !searching && (
            <p className="flex items-center gap-2 p-4 text-ink-muted">
              <PackageSearch className="size-5 shrink-0" aria-hidden />
              {search ? `No hay productos con “${search}” en el nombre.` : 'Todavía no tienes productos. Agrégalos en Inventario.'}
            </p>
          )}

          {status !== 'error' && options.length > 0 && (
            <ul id={listId} role="listbox" aria-label={label} aria-busy={searching} className={`max-h-80 overflow-y-auto ${searching ? 'opacity-60' : ''}`}>
              {options.map((product, index) => (
                // El teclado se maneja desde el input (patrón aria-activedescendant).
                <li
                  key={product.id}
                  id={`${id}-option-${product.id}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`flex min-h-touch cursor-pointer items-center gap-3 border-t border-line px-4 py-2 first:border-t-0 active:bg-primary-soft ${index === activeIndex ? 'bg-primary-soft' : ''}`}
                  onClick={() => select(product)}
                >
                  <span className="flex-1">{product.name}</span>
                  <StockBadge stock={product.stock} />
                  <span className="tabular text-sm text-ink-muted">{product.stock} en stock</span>
                </li>
              ))}
            </ul>
          )}

          {data && data.totalItems > options.length && !searching && (
            <p className="border-t border-line px-4 py-2 text-sm text-ink-muted">
              Mostrando {options.length} de {data.totalItems}. Escribe para encontrar el resto.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
