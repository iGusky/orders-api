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

http.interceptors.response.use(undefined, (error) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    unauthorizedListeners.forEach((listener) => listener());
  }
  return Promise.reject(error);
});
