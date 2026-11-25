export const MAX_POSTGRES_POSITIVE_INTEGER = 2147483647
export const SESSION_DAYS_LIMIT = 1
// Header con la tienda activa de la petición (D28). Express lo lee sin distinguir mayúsculas.
export const STORE_HEADER = 'X-Store-Id'
// Cookie de sesión (D22). Borrarla exige los mismos atributos (Path, Domain, Secure, SameSite) con los que se puso:
// si no coinciden, el navegador la trata como otra cookie y conserva la original.
export const SESSION_COOKIE = 'session'
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
} as const
