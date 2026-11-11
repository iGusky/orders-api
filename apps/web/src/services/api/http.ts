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

// Avisos de "la persona no tiene tienda" (403 USER_DONT_HAVE_STORE en /products y /movements). Los escucha
// AuthProvider para mandar al alta de tienda.
const storeRequiredListeners = new Set<() => void>();

export function onStoreRequired(listener: () => void) {
  storeRequiredListeners.add(listener);
  return () => {
    storeRequiredListeners.delete(listener);
  };
}

http.interceptors.response.use(undefined, (error) => {
  if (axios.isAxiosError<{ errorCode?: string }>(error)) {
    const status = error.response?.status;
    // POST /auth/google también responde 401 si Google no confirma la cuenta; eso lo maneja /iniciar-sesion.
    const isLogin = error.config?.url === '/auth/google';
    if (status === 401 && !isLogin) unauthorizedListeners.forEach((listener) => listener());
    if (status === 403 && error.response?.data?.errorCode === 'USER_DONT_HAVE_STORE') {
      storeRequiredListeners.forEach((listener) => listener());
    }
  }
  return Promise.reject(error);
});
