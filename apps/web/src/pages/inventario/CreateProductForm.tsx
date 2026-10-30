import { useState, type FormEvent } from 'react';
import { CircleAlert, Loader2 } from 'lucide-react';
import { createProduct, getApiErrorBody } from '../../services/api';
import type { Product } from '../../types/product';
import { pesosToCents } from '../../utils/money';

// Límite de la columna Int de PostgreSQL (D15): un valor mayor la API lo rechaza.
const MAX_PRICE_CENTS = 2_147_483_647;
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

interface FormErrors {
  name?: string;
  price?: string;
}

function validate(name: string, price: string): FormErrors {
  const errors: FormErrors = {};
  if (name.trim() === '') errors.name = 'Escribe el nombre del producto.';

  const normalizedPrice = price.replace(/[$,\s]/g, '');
  if (normalizedPrice === '') errors.price = 'Escribe el precio de lista.';
  else if (!PRICE_PATTERN.test(normalizedPrice)) errors.price = 'Escribe el precio con números, por ejemplo 45 o 45.50.';
  else if (pesosToCents(normalizedPrice) > MAX_PRICE_CENTS) errors.price = 'El precio es demasiado alto.';
  return errors;
}

const inputClasses = 'min-h-touch rounded-md border bg-background px-4';

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="flex items-center gap-1 text-sm text-danger">
      <CircleAlert className="size-4 shrink-0" aria-hidden />
      {message}
    </span>
  );
}

interface CreateProductFormProps {
  onCreated: (product: Product) => void;
  onCancel: () => void;
}

export function CreateProductForm({ onCreated, onCancel }: CreateProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const errors = submitted ? validate(name, price) : {};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(name, price)).length > 0 || saving) return;

    setSaving(true);
    setRequestError(null);
    try {
      const product = await createProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        priceCents: pesosToCents(price),
      });
      onCreated(product);
    } catch (error) {
      setRequestError(
        getApiErrorBody(error)?.statusCode === 400
          ? 'La API rechazó los datos. Revisa el nombre y el precio.'
          : 'No se pudo guardar el producto. Revisa tu conexión e inténtalo otra vez.',
      );
      setSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Nombre</span>
        <input
          className={`${inputClasses} ${errors.name ? 'border-danger' : 'border-line'}`}
          value={name}
          autoFocus
          autoComplete="off"
          enterKeyHint="next"
          placeholder="Paquete de 5 stickers"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
          onChange={(e) => setName(e.target.value)}
        />
        <FieldError id="name-error" message={errors.name} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Precio de lista</span>
        <span
          className={`flex min-h-touch items-center rounded-md border bg-background px-4 focus-within:outline-3 focus-within:outline-primary ${errors.price ? 'border-danger' : 'border-line'}`}
        >
          <span className="text-ink-muted" aria-hidden>$</span>
          <input
            className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none"
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="next"
            placeholder="45.00"
            value={price}
            aria-invalid={Boolean(errors.price)}
            aria-describedby={errors.price ? 'price-error' : 'price-help'}
            onChange={(e) => setPrice(e.target.value)}
          />
        </span>
        <FieldError id="price-error" message={errors.price} />
        {!errors.price && (
          <span id="price-help" className="text-sm text-ink-muted">Sirve para sugerir el importe al vender; en cada venta lo puedes cambiar.</span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">
          Descripción <span className="font-normal text-ink-muted">(opcional)</span>
        </span>
        <textarea
          className={`${inputClasses} border-line py-3`}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <p className="rounded-md bg-kraft p-3 text-sm">
        El producto empieza con 0 en stock. Para sumar unidades, registra un reabastecimiento.
      </p>

      {requestError && (
        <p role="alert" className="flex gap-2 rounded-md bg-danger-soft p-3 text-sm">
          <CircleAlert className="size-5 shrink-0 text-danger" aria-hidden />
          {requestError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="h-touch rounded-md border border-line bg-surface px-4 font-semibold active:bg-primary-soft"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex h-touch-lg items-center justify-center gap-2 rounded-md bg-primary px-5 text-lg font-semibold text-on-primary active:bg-primary-pressed disabled:opacity-50"
        >
          {saving && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {saving ? 'Guardando…' : 'Agregar producto'}
        </button>
      </div>
    </form>
  );
}
