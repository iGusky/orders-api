import { useState, type FormEvent } from 'react';
import { CircleAlert, Loader2 } from 'lucide-react';
import { createStore, getApiErrorBody, getDomainError } from '../../services/api';
import { FieldError } from '../../components/FieldError';
import type { CreateStoreInput, StoreInfo } from '../../types/store';
import { failedMessage } from '../../utils/requestErrors';

interface StoreFields {
  name: string;
  address: string;
  phone: string;
  contactEmail: string;
  description: string;
}

type FormErrors = Partial<Record<keyof StoreFields, string>>;

const EMPTY_FIELDS: StoreFields = { name: '', address: '', phone: '', contactEmail: '', description: '' };

// Un teléfono de México tiene 10 dígitos; con lada internacional, más. 8 deja pasar números locales cortos.
const MIN_PHONE_DIGITS = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields: StoreFields): FormErrors {
  const errors: FormErrors = {};
  if (fields.name.trim() === '') errors.name = 'Escribe el nombre de tu tienda.';
  if (fields.address.trim() === '') errors.address = 'Escribe dónde está tu tienda o tu puesto.';

  const phoneDigits = fields.phone.replace(/\D/g, '').length;
  if (fields.phone.trim() === '') errors.phone = 'Escribe un teléfono de contacto.';
  else if (phoneDigits < MIN_PHONE_DIGITS) errors.phone = 'Revisa el teléfono: le faltan dígitos.';

  const email = fields.contactEmail.trim();
  if (email !== '' && !EMAIL_PATTERN.test(email)) errors.contactEmail = 'Revisa el correo, por ejemplo tienda@gmail.com.';
  return errors;
}

function toInput(fields: StoreFields): CreateStoreInput {
  return {
    name: fields.name.trim(),
    address: fields.address.trim(),
    phone: fields.phone.trim(),
    description: fields.description.trim() || undefined,
    contactEmail: fields.contactEmail.trim() || undefined,
  };
}

const fieldClasses = 'min-h-touch rounded-md border bg-surface px-4';

function borderFor(error?: string) {
  return error ? 'border-danger' : 'border-line';
}

interface CreateStoreFormProps {
  onCreated: (store: StoreInfo) => void;
  // La API respondió que la persona ya tiene tienda.
  onAlreadyRegistered: () => void;
}

export function CreateStoreForm({ onCreated, onAlreadyRegistered }: CreateStoreFormProps) {
  const [fields, setFields] = useState<StoreFields>(EMPTY_FIELDS);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const errors = submitted ? validate(fields) : {};

  const setField = (key: keyof StoreFields) => (value: string) => setFields((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(fields)).length > 0 || saving) return;

    setSaving(true);
    setRequestError(null);
    try {
      onCreated(await createStore(toInput(fields)));
    } catch (error) {
      // USER_HAS_STORE: ya la registró (en otro dispositivo, o un doble envío). Se recarga GET /me y
      // <CreateStorePage> sigue a la pantalla pedida con la tienda que ya existe.
      if (getDomainError(error)?.errorCode === 'USER_HAS_STORE') {
        onAlreadyRegistered();
        return;
      }
      setRequestError(
        getApiErrorBody(error)?.statusCode === 400
          ? 'La API rechazó los datos. Revisa el nombre, la dirección, el teléfono y el correo.'
          : failedMessage('No se pudo registrar la tienda.', error),
      );
      setSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Nombre de la tienda</span>
        <input
          className={`${fieldClasses} ${borderFor(errors.name)}`}
          value={fields.name}
          autoComplete="organization"
          enterKeyHint="next"
          placeholder="Stickers del bazar"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'store-name-error' : undefined}
          onChange={(e) => setField('name')(e.target.value)}
        />
        {errors.name && <FieldError id="store-name-error" message={errors.name} />}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Dirección</span>
        <input
          className={`${fieldClasses} ${borderFor(errors.address)}`}
          value={fields.address}
          autoComplete="street-address"
          enterKeyHint="next"
          placeholder="Bazar de la colonia, puesto 12"
          aria-invalid={Boolean(errors.address)}
          aria-describedby={errors.address ? 'store-address-error' : undefined}
          onChange={(e) => setField('address')(e.target.value)}
        />
        {errors.address && <FieldError id="store-address-error" message={errors.address} />}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Teléfono</span>
        <input
          className={`${fieldClasses} ${borderFor(errors.phone)} tabular`}
          type="tel"
          inputMode="tel"
          value={fields.phone}
          autoComplete="tel"
          enterKeyHint="next"
          placeholder="55 1234 5678"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? 'store-phone-error' : undefined}
          onChange={(e) => setField('phone')(e.target.value)}
        />
        {errors.phone && <FieldError id="store-phone-error" message={errors.phone} />}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">
          Correo de contacto <span className="font-normal text-ink-muted">(opcional)</span>
        </span>
        <input
          className={`${fieldClasses} ${borderFor(errors.contactEmail)}`}
          type="email"
          inputMode="email"
          value={fields.contactEmail}
          autoComplete="email"
          autoCapitalize="none"
          enterKeyHint="next"
          placeholder="tienda@gmail.com"
          aria-invalid={Boolean(errors.contactEmail)}
          aria-describedby={errors.contactEmail ? 'store-email-error' : undefined}
          onChange={(e) => setField('contactEmail')(e.target.value)}
        />
        {errors.contactEmail && <FieldError id="store-email-error" message={errors.contactEmail} />}
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">
          Descripción <span className="font-normal text-ink-muted">(opcional)</span>
        </span>
        <textarea
          className={`${fieldClasses} border-line py-3`}
          rows={2}
          value={fields.description}
          placeholder="Qué vendes, en qué días te pones"
          onChange={(e) => setField('description')(e.target.value)}
        />
      </label>

      {requestError && (
        <p role="alert" className="flex gap-2 rounded-md bg-danger-soft p-3 text-sm">
          <CircleAlert className="size-5 shrink-0 text-danger" aria-hidden />
          {requestError}
        </p>
      )}

      <div className="flex md:justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex h-touch-lg w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-lg font-semibold text-on-primary active:bg-primary-pressed disabled:opacity-50 md:w-auto"
        >
          {saving && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {saving ? 'Registrando…' : 'Registrar tienda'}
        </button>
      </div>
    </form>
  );
}
