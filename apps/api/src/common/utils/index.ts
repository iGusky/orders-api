// Forma única de comparar correos (RF1, RF2): sin espacios y en minúsculas.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
