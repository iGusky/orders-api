// Google Identity Services (D23): carga el script del botón "Iniciar sesión con Google" y entrega el ID token.
// No es parte del cliente de la API: el ID token se manda a la API con loginWithGoogle (services/api/auth.ts).
// Tipos mínimos escritos a mano para no agregar @types/google.accounts.

interface CredentialResponse {
  credential: string;
}

export interface GsiButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    ux_mode?: 'popup' | 'redirect';
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: GsiButtonOptions): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise: Promise<GoogleAccountsId> | null = null;

function loadScript(): Promise<GoogleAccountsId> {
  const loaded = window.google?.accounts?.id;
  if (loaded) return Promise.resolve(loaded);

  scriptPromise ??= new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    const fail = () => {
      // Permite reintentar: la siguiente llamada vuelve a insertar el script.
      script.remove();
      scriptPromise = null;
      reject(new Error('No se pudo cargar Google Identity Services'));
    };
    script.onload = () => {
      const id = window.google?.accounts?.id;
      if (id) resolve(id);
      else fail();
    };
    script.onerror = fail;
    document.head.append(script);
  });
  return scriptPromise;
}

// initialize() se llama una sola vez por página; el callback activo se cambia aquí sin reinicializar.
let initialized = false;
let credentialHandler: ((credential: string) => void) | null = null;

export async function setupGoogleSignIn(onCredential: (credential: string) => void): Promise<GoogleAccountsId> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Falta VITE_GOOGLE_CLIENT_ID en apps/web/.env');

  const id = await loadScript();
  credentialHandler = onCredential;
  if (!initialized) {
    id.initialize({
      client_id: clientId,
      callback: (response) => credentialHandler?.(response.credential),
      use_fedcm_for_button: true,
    });
    initialized = true;
  }
  return id;
}

export function clearGoogleSignIn() {
  credentialHandler = null;
}

// Al cerrar sesión: que Google no vuelva a elegir la cuenta automáticamente.
export function disableGoogleAutoSelect() {
  window.google?.accounts?.id?.disableAutoSelect();
}
