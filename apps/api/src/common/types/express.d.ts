import type { StoreRole } from '../../../generated/prisma/enums.js';

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface StoreInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  description: string | null;
  contactEmail: string | null;
}

// Una tienda a la que pertenece la persona, con su rol en ella (GET /me → stores).
export interface MemberStore extends StoreInfo {
  role: StoreRole;
}

// La tienda activa de la petición (D28) y el rol de la persona en ella.
export interface StoreMembership {
  store: StoreInfo;
  role: StoreRole;
}

export interface CurrentUser extends UserInfo {
  stores: MemberStore[];
}

// Lo que deja el AuthGuard sobre la tienda: el id que pidió el cliente en X-Store-Id (o null) y la membresía
// encontrada (null si no es miembro, la tienda no existe o está borrada). Los decoradores deciden qué error lanzar.
export interface StoreContext {
  requestedStoreId: string | null;
  membership: StoreMembership | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserInfo;
      storeContext?: StoreContext;
    }
  }
}

export {};
