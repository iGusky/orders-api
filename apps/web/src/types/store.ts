// Tienda (fase 2, D16; fase 3, D25-D28). Ver "Tiendas" y "Empleados y tienda activa" en docs/api.md.

// La tienda tal como viene en GET /me (StoreInfo de la API): solo los datos del negocio.
export interface StoreInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  description: string | null;
  contactEmail: string | null;
}

// Rol de la persona en una tienda (D25). Solo OWNER registra ajustes y gestiona el equipo (RF6).
export const STORE_ROLES = ['OWNER', 'EMPLOYEE'] as const;
export type StoreRole = (typeof STORE_ROLES)[number];

// Una tienda a la que pertenece la persona, con su rol en ella (GET /me → stores).
export interface MemberStore extends StoreInfo {
  role: StoreRole;
}

// Respuesta de POST /stores: todas las columnas de Store.
export interface Store extends StoreInfo {
  ownerId: string;
  createdAt: string;
  deletedAt: string | null;
}

// Body de POST /stores (igual que CreateStoreDto de la API). Los opcionales se omiten si están vacíos.
export interface CreateStoreInput {
  name: string;
  address: string;
  phone: string;
  description?: string;
  contactEmail?: string;
}
