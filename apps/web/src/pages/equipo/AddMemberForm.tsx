import { useState, type FormEvent } from 'react';
import { CircleAlert, Loader2, UserPlus } from 'lucide-react';
import { FieldError } from '../../components/FieldError';
import { addMember, getApiErrorBody, getDomainError } from '../../services/api';
import type { AddMemberResult } from '../../types/member';
import { failedMessage } from '../../utils/requestErrors';

// Validación mínima para avisar en el campo; la API valida de verdad (@IsEmail).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailError(email: string): string | undefined {
  if (email.trim() === '') return 'Escribe el correo de tu empleado.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Escribe un correo completo, por ejemplo ana@gmail.com.';
  return undefined;
}

// Errores que se muestran bajo el campo: tienen que ver con el correo escrito.
function fieldErrorFrom(error: unknown): string | undefined {
  const code = getDomainError(error)?.errorCode;
  if (code === 'MEMBER_ALREADY_EXISTS') return 'Esa persona ya tiene acceso a tu tienda.';
  if (code === 'INVITATION_ALREADY_EXISTS') return 'Ya agregaste ese correo. Tendrá acceso en cuanto entre a la app.';
  if (getApiErrorBody(error)?.statusCode === 400) return 'Revisa el correo: la API no lo aceptó.';
  return undefined;
}

interface AddMemberFormProps {
  onAdded: (result: AddMemberResult) => void;
}

// RF1: el dueño agrega a alguien por su correo de Google. No se envía ningún correo (D29).
export function AddMemberForm({ onAdded }: AddMemberFormProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiFieldError, setApiFieldError] = useState<string | undefined>();
  const [requestError, setRequestError] = useState<string | null>(null);

  const fieldError = (submitted ? emailError(email) : undefined) ?? apiFieldError;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setRequestError(null);
    setApiFieldError(undefined);
    if (emailError(email) || saving) return;

    setSaving(true);
    try {
      onAdded(await addMember(email.trim()));
      setEmail('');
      setSubmitted(false);
    } catch (error) {
      const message = fieldErrorFrom(error);
      if (message) setApiFieldError(message);
      else setRequestError(failedMessage('No se pudo agregar a esa persona.', error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
      <label className="flex flex-col gap-1">
        <span className="font-semibold">Correo de Google de tu empleado</span>
        <input
          type="email"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="send"
          placeholder="ana@gmail.com"
          className={`min-h-touch rounded-md border bg-background px-4 ${fieldError ? 'border-danger' : 'border-line'}`}
          value={email}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? 'member-email-error' : 'member-email-help'}
          onChange={(e) => {
            setEmail(e.target.value);
            setApiFieldError(undefined);
          }}
        />
        {fieldError ? (
          <FieldError id="member-email-error" message={fieldError} />
        ) : (
          <span id="member-email-help" className="text-sm text-ink-muted">
            Si todavía no ha entrado a la app, tendrá acceso en cuanto entre con ese correo.
          </span>
        )}
      </label>

      {requestError && (
        <p role="alert" className="flex gap-2 rounded-md bg-danger-soft p-3 text-sm">
          <CircleAlert className="size-5 shrink-0 text-danger" aria-hidden />
          {requestError}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="flex h-touch-lg w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-lg font-semibold text-on-primary active:bg-primary-pressed disabled:opacity-50 md:w-auto md:self-end"
      >
        {saving ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <UserPlus className="size-5" aria-hidden />}
        {saving ? 'Agregando…' : 'Agregar al equipo'}
      </button>
    </form>
  );
}
