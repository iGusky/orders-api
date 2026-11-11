// Tienda (fase 2, D16). Ver "Tiendas" en docs/api.md.

// Todas las columnas de Store, tal como las devuelven GET /me y POST /stores.
export interface Store {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  phone: string;
  description: string | null;
  contactEmail: string | null;
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
