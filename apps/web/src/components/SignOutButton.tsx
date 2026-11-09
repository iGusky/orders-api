import { useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

// Botón de icono para cerrar la sesión. Al terminar, RequireAuth manda a /iniciar-sesion.
export function SignOutButton() {
  const { signOut } = useAuth();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleClick = async () => {
    setPending(true);
    setFailed(false);
    try {
      await signOut();
    } catch {
      setFailed(true);
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {failed && <span role="alert" className="text-sm text-danger">No se pudo cerrar sesión</span>}
      <button
        type="button"
        aria-label="Cerrar sesión"
        disabled={pending}
        onClick={handleClick}
        className="grid size-touch shrink-0 place-items-center rounded-full active:bg-primary-soft disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <LogOut className="size-6" aria-hidden />}
      </button>
    </div>
  );
}
