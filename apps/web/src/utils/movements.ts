import { PackagePlus, PackageX, ShoppingBag, SlidersHorizontal, Undo2, type LucideIcon } from 'lucide-react';
import type { Movement, MovementType } from '../types/movement';

// Textos e iconos por tipo de movimiento (docs/styles.md, 6.5). Términos del glosario de modelo-de-datos.md.
export const MOVEMENT_TYPE_META: Record<MovementType, { label: string; icon: LucideIcon }> = {
  SALE: { label: 'Venta', icon: ShoppingBag },
  RESTOCK: { label: 'Reabastecimiento', icon: PackagePlus },
  RETURN: { label: 'Devolución', icon: Undo2 },
  SHRINKAGE: { label: 'Merma', icon: PackageX },
  ADJUSTMENT: { label: 'Ajuste', icon: SlidersHorizontal },
};

export function movementLabel(movement: Movement): string {
  const { label } = MOVEMENT_TYPE_META[movement.type];
  if (movement.type !== 'ADJUSTMENT') return label;
  return movement.direction === 'IN' ? 'Ajuste de entrada' : 'Ajuste de salida';
}
