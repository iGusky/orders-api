import type { ChangeEvent, ReactNode } from 'react';
import { FieldError } from '../../components/FieldError';
import { MAX_CENTS, parsePesos } from '../../utils/money';

// Campos de un producto, compartidos por el alta (CreateProductForm) y la edición (EditProductForm).

export interface ProductFieldValues {
  name: string;
  price: string; // como lo escribe el usuario, en pesos; se convierte con parsePesos al enviar
  description: string;
}

export interface ProductFieldErrors {
  name?: string;
  price?: string;
}

export function validateProductFields({ name, price }: ProductFieldValues): ProductFieldErrors {
  const errors: ProductFieldErrors = {};
  if (name.trim() === '') errors.name = 'Escribe el nombre del producto.';

  const priceCents = parsePesos(price);
  if (price.trim() === '') errors.price = 'Escribe el precio de lista.';
  else if (priceCents === null) errors.price = 'Escribe el precio con números, por ejemplo 45 o 45.50.';
  else if (priceCents > MAX_CENTS) errors.price = 'El precio es demasiado alto.';
  return errors;
}

const inputClasses = 'min-h-touch rounded-md border bg-background px-4';

interface ProductFieldsProps {
  values: ProductFieldValues;
  errors: ProductFieldErrors;
  onChange: (values: ProductFieldValues) => void;
  autoFocusName?: boolean;
  // Avisos bajo cada campo (por ejemplo, el efecto de cambiar el nombre). Sustituyen la ayuda por defecto del precio.
  nameNotice?: ReactNode;
  priceNotice?: ReactNode;
}

export function ProductFields({ values, errors, onChange, autoFocusName, nameNotice, priceNotice }: ProductFieldsProps) {
  const set = (field: keyof ProductFieldValues) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...values, [field]: e.target.value });

  return (
    <>
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Nombre</span>
        <input
          className={`${inputClasses} ${errors.name ? 'border-danger' : 'border-line'}`}
          value={values.name}
          autoFocus={autoFocusName}
          autoComplete="off"
          enterKeyHint="next"
          placeholder="Paquete de 5 stickers"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-error' : nameNotice ? 'name-notice' : undefined}
          onChange={set('name')}
        />
        {errors.name && <FieldError id="name-error" message={errors.name} />}
        {!errors.name && nameNotice && <span id="name-notice">{nameNotice}</span>}
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
            value={values.price}
            aria-invalid={Boolean(errors.price)}
            aria-describedby={errors.price ? 'price-error' : 'price-help'}
            onChange={set('price')}
          />
        </span>
        {errors.price && <FieldError id="price-error" message={errors.price} />}
        {!errors.price && (
          <span id="price-help" className="text-sm text-ink-muted">
            {priceNotice ?? 'Sirve para sugerir el importe al vender; en cada venta lo puedes cambiar.'}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">
          Descripción <span className="font-normal text-ink-muted">(opcional)</span>
        </span>
        <textarea
          className={`${inputClasses} border-line py-3`}
          rows={2}
          value={values.description}
          onChange={set('description')}
        />
      </label>
    </>
  );
}
