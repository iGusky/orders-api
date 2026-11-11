import { Store, User } from '../../../generated/prisma/client.ts';

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

export interface UserWithStore extends UserInfo {
  store: StoreInfo | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserInfo;
    }
  }
}

export {};
