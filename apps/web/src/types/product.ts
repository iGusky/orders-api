import type { Paginated } from './pagination';

export interface Product {
  id: string;                 // UUID v7
  name: string;
  description: string | null;
  priceCents: number;         // precio de lista, entero en centavos
  stock: number;              // unidades disponibles
  createdAt: string;          // fecha ISO 8601
  deletedAt: string | null;   // la API solo devuelve productos activos (null)
}

export type PaginatedProducts = Paginated<Product>;

// Body de POST /products. El stock no se manda: nace en 0.
export interface CreateProductInput {
  name: string;
  description?: string;
  priceCents: number;
}
