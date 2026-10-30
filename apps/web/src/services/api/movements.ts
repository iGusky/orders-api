import { http } from './http';
import type { PaginationParams } from '../../types/pagination';
import type { CreateMovementInput, Movement, PaginatedMovements } from '../../types/movement';

// La API acepta search pero lo ignora en movimientos.
export async function getMovements(
  params: Omit<PaginationParams, 'search'>,
  options: { signal?: AbortSignal } = {},
): Promise<PaginatedMovements> {
  const { data } = await http.get<PaginatedMovements>('/movements', { params, signal: options.signal });
  return data;
}

export async function createMovement(input: CreateMovementInput): Promise<Movement> {
  const { data } = await http.post<Movement>('/movements', input);
  return data;
}
