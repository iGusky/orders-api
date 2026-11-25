import type { MemberStore } from '../types/store';

// La última tienda elegida en este dispositivo. Es solo una comodidad para no preguntar cada vez: la API comprueba
// la pertenencia en cada petición (D28). Se lee al cargar, no se sigue entre pestañas: cada pestaña conserva la suya
// y cambiarla en una no cambia la otra.
const STORAGE_KEY = 'activeStoreId';

function readRememberedStoreId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function rememberStoreId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Sin almacenamiento (modo privado, bloqueado): la próxima vez se vuelve a preguntar.
  }
}

// Tienda activa al cargar la sesión: la recordada si la persona sigue en ella; si solo tiene una, esa.
// Con varias y ninguna recordada devuelve null y <RequireStore> manda a elegir: nunca se adivina (RF7).
export function pickInitialStoreId(stores: MemberStore[]): string | null {
  const remembered = readRememberedStoreId();
  if (remembered && stores.some((store) => store.id === remembered)) return remembered;
  return stores.length === 1 ? stores[0].id : null;
}
