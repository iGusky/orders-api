import axios from 'axios';

// Instancia única de axios. Solo la usan los módulos de src/services/api.
// withCredentials: la sesión viaja en una cookie httpOnly que el navegador manda solo (D22).
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Avisos de "la sesión ya no es válida" (401). Los escucha AuthProvider para mandar a iniciar sesión.
const unauthorizedListeners = new Set<() => void>();

export function onUnauthorized(listener: () => void) {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

// Tienda activa (D28). La API la lee del header X-Store-Id en cada petición y comprueba que la persona pertenece a
// ella. La fija AuthProvider; las pantallas nunca la mandan a mano.
export const STORE_HEADER = 'X-Store-Id';
let activeStoreId: string | null = null;

export function setActiveStoreId(id: string | null) {
  activeStoreId = id;
}

export function getActiveStoreId(): string | null {
  return activeStoreId;
}

http.interceptors.request.use((config) => {
  if (activeStoreId) config.headers.set(STORE_HEADER, activeStoreId);
  return config;
});

// Avisos de "no se puede operar en esta tienda". Los escucha AuthProvider para mandar a elegir otra o al alta.
// - lost: 404 STORE_NOT_FOUND (ya no es miembro, o la tienda se borró).
// - missing: 400 STORE_NOT_SELECTED (la petición salió sin tienda).
// storeId es la tienda con la que salió la petición, para ignorar respuestas tardías de una tienda anterior.
export type StoreUnavailableReason = 'lost' | 'missing';
type StoreUnavailableListener = (storeId: string | null, reason: StoreUnavailableReason) => void;
const storeUnavailableListeners = new Set<StoreUnavailableListener>();

export function onStoreUnavailable(listener: StoreUnavailableListener) {
  storeUnavailableListeners.add(listener);
  return () => {
    storeUnavailableListeners.delete(listener);
  };
}

function storeUnavailableReason(status: number | undefined, errorCode: string | undefined): StoreUnavailableReason | null {
  if (status === 404 && errorCode === 'STORE_NOT_FOUND') return 'lost';
  if (status === 400 && errorCode === 'STORE_NOT_SELECTED') return 'missing';
  return null;
}

http.interceptors.response.use(undefined, (error) => {
  if (axios.isAxiosError<{ errorCode?: string }>(error)) {
    const status = error.response?.status;
    // POST /auth/google también responde 401 si Google no confirma la cuenta; eso lo maneja /iniciar-sesion.
    const isLogin = error.config?.url === '/auth/google';
    if (status === 401 && !isLogin) unauthorizedListeners.forEach((listener) => listener());
    const reason = storeUnavailableReason(status, error.response?.data?.errorCode);
    if (reason) {
      const sent = error.config?.headers?.get(STORE_HEADER);
      const storeId = typeof sent === 'string' ? sent : null;
      storeUnavailableListeners.forEach((listener) => listener(storeId, reason));
    }
  }
  return Promise.reject(error);
});
