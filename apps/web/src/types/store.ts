// Tienda (fase 2, D16). Ver "Tiendas" en docs/api.md.

// La tienda tal como viene en GET /me (StoreInfo de la API): solo los datos del negocio.
export interface StoreInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  description: string | null;
  contactEmail: string | null;
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
