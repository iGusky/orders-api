// Fase 2 (D20-D24). Contrato propuesto en docs/api.md: la API todavía no lo implementa.

export interface StoreSummary {
  id: string;
  name: string;
}

// Respuesta de GET /me: la persona de la sesión y su tienda, si ya la registró (D16).
export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  store: StoreSummary | null;
}

// Body de POST /auth/google: el ID token que entrega el botón de Google Identity Services (D23).
export interface GoogleLoginInput {
  credential: string;
}
