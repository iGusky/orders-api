import { useCallback, useState, type FormEvent } from 'react';
import { NavLink } from 'react-router';
import { Check, CircleAlert, Loader2, PackagePlus } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { ProductCombobox } from '../../components/ProductCombobox';
import { QuantityStepper } from '../../components/QuantityStepper';
import { Toast } from '../../components/Toast';
import { createMovement, getApiErrorBody, getDomainError, getProductById } from '../../services/api';
import type { Product } from '../../types/product';

// Límite de la columna Int de PostgreSQL: el stock resultante no puede pasarlo.
const MAX_STOCK = 2_147_483_647;

interface SavedRestock {
  productName: string;
  added: number;
  stock: number;
}

function validateQuantity(value: string, product: Product | null): string | undefined {
  if (value.trim() === '') return 'Escribe cuántas unidades vas a agregar.';
  const quantity = Number(value);
  if (!Number.isInteger(quantity)) return 'Usa un número entero, sin decimales.';
  if (quantity < 1) return 'Agrega al menos 1 unidad.';
  if (product && product.stock + quantity > MAX_STOCK) return 'La cantidad es demasiado grande.';
  return undefined;
}

function requestErrorMessage(error: unknown): string {
  if (getDomainError(error)?.errorCode === 'PRODUCT_NOT_FOUND') return 'Ese producto ya no existe. Elige otro.';
  if (getApiErrorBody(error)?.statusCode === 400) return 'La API rechazó el movimiento. Revisa la cantidad.';
  return 'No se pudo guardar el stock. Revisa tu conexión e inténtalo otra vez.';
}

export function AddStockPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<SavedRestock | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [optionsVersion, setOptionsVersion] = useState(0);

  const productError = submitted && !product ? 'Elige un producto.' : undefined;
  const quantityError = submitted ? validateQuantity(quantity, product) : undefined;
  const validQuantity = validateQuantity(quantity, product) === undefined ? Number(quantity) : null;

  const dismissToast = useCallback(() => setToast(null), []);

  const handleProductChange = (next: Product | null) => {
    setProduct(next);
    setRequestError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!product || validQuantity === null || saving) return;

    setSaving(true);
    setRequestError(null);
    try {
      await createMovement({
        type: 'RESTOCK',
        // En RESTOCK el importe del renglón es 0 (D5, I7).
        items: [{ productId: product.id, quantity: validQuantity, lineTotalCents: 0 }],
      });

      // El movimiento no devuelve el producto: se consulta para mostrar el stock real.
      const stock = await getProductById(product.id)
        .then((updated) => updated.stock)
        .catch(() => product.stock + validQuantity);

      setLastSaved({ productName: product.name, added: validQuantity, stock });
      setToast('Stock agregado');
      setProduct(null);
      setQuantity('1');
      setSubmitted(false);
      setOptionsVersion((v) => v + 1);
    } catch (error) {
      setRequestError(requestErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 pt-safe pb-32 md:px-6 md:pb-10">
      <PageHeader title="Agregar stock">Suma unidades a un producto cuando llega mercancía.</PageHeader>

      {lastSaved && (
        <div role="status" className="flex gap-3 rounded-lg border border-primary bg-primary-soft p-4">
          <Check className="size-6 shrink-0 text-primary" aria-hidden />
          <div className="flex flex-col gap-1">
            <p>
              Agregaste <span className="tabular font-semibold">{lastSaved.added}</span> a {lastSaved.productName}.
              Ahora hay <span className="tabular font-semibold">{lastSaved.stock}</span> en stock.
            </p>
            <NavLink to="/movimientos" className="flex min-h-touch w-fit items-center font-semibold text-primary underline underline-offset-4">
              Ver movimientos
            </NavLink>
          </div>
        </div>
      )}

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
        <ProductCombobox label="Producto" value={product} onChange={handleProductChange} error={productError} refreshKey={optionsVersion} />

        <div className="flex flex-col gap-2">
          <label htmlFor="restock-quantity" className="font-semibold">Unidades que llegaron</label>
          <QuantityStepper
            id="restock-quantity"
            value={quantity}
            onChange={setQuantity}
            max={product ? MAX_STOCK - product.stock : MAX_STOCK}
            invalid={Boolean(quantityError)}
            describedBy={quantityError ? 'restock-quantity-error' : 'restock-quantity-help'}
          />
          {quantityError ? (
            <span id="restock-quantity-error" className="flex items-center gap-1 text-sm text-danger">
              <CircleAlert className="size-4 shrink-0" aria-hidden />
              {quantityError}
            </span>
          ) : (
            <span id="restock-quantity-help" className="text-sm text-ink-muted">
              {product && validQuantity !== null
                ? `${product.name} pasará de ${product.stock} a ${product.stock + validQuantity} en stock.`
                : 'Cuenta piezas sueltas, no paquetes.'}
            </span>
          )}
        </div>

        {requestError && (
          <p role="alert" className="flex gap-2 rounded-md bg-danger-soft p-3">
            <CircleAlert className="size-5 shrink-0 text-danger" aria-hidden />
            {requestError}
          </p>
        )}

        {/* Celular: barra fija al alcance del pulgar. iPad: al final del formulario. */}
        <div className="fixed inset-x-0 bottom-0 z-40 bg-surface px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-float md:static md:bg-transparent md:p-0 md:shadow-none">
          <button
            type="submit"
            disabled={saving}
            className="flex h-touch-lg w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-lg font-semibold text-on-primary active:bg-primary-pressed disabled:opacity-50 md:w-auto"
          >
            {saving ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <PackagePlus className="size-6" aria-hidden />}
            {saving ? 'Guardando…' : 'Agregar stock'}
          </button>
        </div>
      </form>

      <Toast message={toast} onDismiss={dismissToast} />
    </main>
  );
}

export default AddStockPage;
