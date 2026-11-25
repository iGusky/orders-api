import { useState, type FormEvent } from 'react';
import { CircleAlert, Loader2 } from 'lucide-react';
import { createProduct, getApiErrorBody } from '../../services/api';
import type { Product } from '../../types/product';
import { parsePesos } from '../../utils/money';
import { failedMessage } from '../../utils/requestErrors';
import { ProductFields, validateProductFields, type ProductFieldValues } from './ProductFields';

interface CreateProductFormProps {
  onCreated: (product: Product) => void;
  onCancel: () => void;
}

export function CreateProductForm({ onCreated, onCancel }: CreateProductFormProps) {
  const [values, setValues] = useState<ProductFieldValues>({ name: '', price: '', description: '' });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const errors = submitted ? validateProductFields(values) : {};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validateProductFields(values)).length > 0 || saving) return;

    setSaving(true);
    setRequestError(null);
    try {
      const product = await createProduct({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        priceCents: parsePesos(values.price) ?? 0,
      });
      onCreated(product);
    } catch (error) {
      setRequestError(
        getApiErrorBody(error)?.statusCode === 400
          ? 'La API rechazó los datos. Revisa el nombre y el precio.'
          : failedMessage('No se pudo guardar el producto.', error),
      );
      setSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <ProductFields values={values} errors={errors} onChange={setValues} autoFocusName />

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
