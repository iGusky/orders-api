// Fase 2 (D20-D24). Ver "Sesión (fase 2)" en docs/api.md.

// Tienda tal como la devuelve GET /me (todas las columnas de Store).
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

// Respuesta de GET /me: la persona de la sesión y su tienda, si ya la registró (D16).
export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  store: Store | null;
}

// Body de POST /auth/google: el ID token que entrega el botón de Google Identity Services (D23).
export interface GoogleLoginInput {
  credential: string;
}
