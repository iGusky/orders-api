import { http } from './http';
import type { PaginationParams } from '../../types/pagination';
import type { CreateProductInput, PaginatedProducts, Product } from '../../types/product';

export async function getProducts(
  params: PaginationParams,
  options: { signal?: AbortSignal } = {},
): Promise<PaginatedProducts> {
  const { data } = await http.get<PaginatedProducts>('/products', { params, signal: options.signal });
  return data;
}

export async function getProductById(id: string): Promise<Product> {
  const { data } = await http.get<Product>(`/products/${id}`);
  return data;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const { data } = await http.post<Product>('/products', input);
  return data;
}
