// Fase 2 (D20-D24) y fase 3 (D26). Ver "Sesión (fase 2)" y "Empleados y tienda activa" en docs/api.md.

import type { MemberStore } from './store';

// GET /me: la persona de la sesión y todas las tiendas a las que pertenece, con su rol.
// Lista vacía si no es dueña ni empleada de ninguna.
export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  stores: MemberStore[];
}

// Body de POST /auth/google: el ID token que entrega el botón de Google Identity Services (D23).
export interface GoogleLoginInput {
  credential: string;
}
