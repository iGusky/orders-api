import type { StoreRole } from '../types/store';

// Términos del glosario (modelo-de-datos.md, 9.2).
export const STORE_ROLE_LABEL: Record<StoreRole, string> = {
  OWNER: 'Dueño',
  EMPLOYEE: 'Empleado',
};
