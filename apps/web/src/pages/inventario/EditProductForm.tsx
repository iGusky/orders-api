import { useState, type FormEvent } from 'react';
import { CircleAlert, Info, Loader2 } from 'lucide-react';
import { getApiErrorBody, getDomainError, updateProduct } from '../../services/api';
import type { Product, UpdateProductInput } from '../../types/product';
import { centsToInput, formatCents, parsePesos } from '../../utils/money';
import { failedMessage } from '../../utils/requestErrors';
import { ProductFields, validateProductFields, type ProductFieldValues } from './ProductFields';

// Solo lo que cambió (D32). Comparar contra el producto original evita mandar campos que otra persona pudo haber
// editado mientras esta hoja estaba abierta.
function buildChanges(product: Product, values: ProductFieldValues): UpdateProductInput {
  const changes: UpdateProductInput = {};
  const name = values.name.trim();
  const priceCents = parsePesos(values.price) ?? product.priceCents;
  const description = values.description.trim() || null;

  if (name !== product.name) changes.name = name;
  if (priceCents !== product.priceCents) changes.priceCents = priceCents;
  if (description !== (product.description ?? null)) changes.description = description;
  return changes;
}

function saveErrorMessage(error: unknown): string {
  const code = getDomainError(error)?.errorCode;
  if (code === 'ROLE_NOT_ALLOWED') return 'Solo el dueño de la tienda puede editar productos.';
  if (code === 'PRODUCT_NOT_FOUND') return 'Este producto ya no existe. Cierra y actualiza el inventario.';
  if (getApiErrorBody(error)?.statusCode === 400) return 'La API rechazó los datos. Revisa el nombre y el precio.';
  return failedMessage('No se pudieron guardar los cambios.', error);
}

function Notice({ children }: { children: string }) {
  return (
    <span className="flex gap-2 rounded-md bg-kraft p-3 text-sm text-ink">
      <Info className="size-5 shrink-0 text-kraft-ink" aria-hidden />
      {children}
    </span>
  );
}

interface EditProductFormProps {
  product: Product;
  onSaved: (product: Product) => void;
  onCancel: () => void;
}

export function EditProductForm({ product, onSaved, onCancel }: EditProductFormProps) {
  const [values, setValues] = useState<ProductFieldValues>({
    name: product.name,
    price: centsToInput(product.priceCents),
    description: product.description ?? '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const errors = submitted ? validateProductFields(values) : {};
  const fieldsValid = Object.keys(validateProductFields(values)).length === 0;
  const changes = fieldsValid ? buildChanges(product, values) : {};
  const hasChanges = Object.keys(changes).length > 0;

  // Avisos de D32: el nombre nuevo se ve en todo el historial; el precio nuevo no toca lo ya registrado.
  const nameNotice = changes.name !== undefined && (
    <Notice>
      {`Los movimientos ya registrados, los selectores de producto y el inventario mostrarán “${changes.name}” en lugar de “${product.name}”, también en ventas pasadas.`}
    </Notice>
  );
  const priceNotice =
    changes.priceCents !== undefined
      ? `Antes ${formatCents(product.priceCents)}. Las ventas ya registradas conservan su importe; el nuevo precio solo se sugerirá en ventas nuevas.`
      : undefined;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!fieldsValid || saving) return;
    if (!hasChanges) {
      onCancel();
      return;
    }

    setSaving(true);
    setRequestError(null);
    try {
      onSaved(await updateProduct(product.id, changes));
    } catch (error) {
      setRequestError(saveErrorMessage(error));
      setSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <ProductFields
        values={values}
        errors={errors}
        onChange={setValues}
        nameNotice={nameNotice || undefined}
        priceNotice={priceNotice}
      />

      <p className="text-sm text-ink-muted">
        El stock no se edita aquí. Para corregirlo, registra un reabastecimiento, una merma o un ajuste.
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
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
