import { http } from './http';
import type { CreateStoreInput, Store } from '../../types/store';

// Crea la tienda de la persona de la sesión. 409 si ya tiene una (I14).
export async function createStore(input: CreateStoreInput): Promise<Store> {
  const { data } = await http.post<Store>('/stores', input);
  return data;
}
