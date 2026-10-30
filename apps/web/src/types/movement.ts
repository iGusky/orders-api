import type { Paginated } from './pagination';

export const MOVEMENT_TYPES = ['RESTOCK', 'SALE', 'RETURN', 'SHRINKAGE', 'ADJUSTMENT'] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const MOVEMENT_DIRECTIONS = ['IN', 'OUT'] as const;
export type MovementDirection = (typeof MOVEMENT_DIRECTIONS)[number];

interface MovementBase {
  id: string;          // UUID v7
  occurredAt: string;  // fecha ISO 8601; JSON no tiene tipo Date
  createdAt: string;   // fecha ISO 8601
  totalCents: number;  // entero en centavos
}

// Refleja Movement_direction_check: direction solo existe en ADJUSTMENT
export type Movement =
  | (MovementBase & { type: 'ADJUSTMENT'; direction: MovementDirection })
  | (MovementBase & { type: Exclude<MovementType, 'ADJUSTMENT'>; direction: null });

export type PaginatedMovements = Paginated<Movement>;

export interface CreateMovementItemInput {
  productId: string;
  quantity: number;        // entero > 0
  lineTotalCents: number;  // importe total del renglón; 0 salvo en SALE y RETURN
}

// Body de POST /movements. Ojo: el request usa "ocurredAt" y la respuesta "occurredAt".
export type CreateMovementInput =
  | { type: 'ADJUSTMENT'; direction: MovementDirection; items: CreateMovementItemInput[]; ocurredAt?: string }
  | { type: Exclude<MovementType, 'ADJUSTMENT'>; items: CreateMovementItemInput[]; ocurredAt?: string };
