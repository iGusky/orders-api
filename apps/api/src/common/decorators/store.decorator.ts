import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { StoreMembership } from '../types/express.js';
import { StoreNotSelectedError } from '../../modules/stores/exceptions/StoreNotSelectedError.js';
import { StoreNotFoundError } from '../../modules/stores/exceptions/StoreNotFoundError.js';

// La membresía que resolvió el AuthGuard. Solo los endpoints que la piden exigen tienda: /me o /stores no.
// - Sin header X-Store-Id: STORE_NOT_SELECTED (400).
// - Con un id que no es una tienda activa de la que la persona sea miembro: STORE_NOT_FOUND (404, D19).
export function requireMembership(request: Request): StoreMembership {
  const context = request.storeContext;
  if (!context?.requestedStoreId) throw new StoreNotSelectedError();
  if (!context.membership) throw new StoreNotFoundError();
  return context.membership;
}

// Tienda activa de la petición (D18, D28).
export const Store = createParamDecorator(
  (data: unknown, context: ExecutionContext) =>
    requireMembership(context.switchToHttp().getRequest<Request>()).store,
);

// Tienda activa y rol de la persona en ella, para reglas que dependen del rol (D30).
export const Membership = createParamDecorator(
  (data: unknown, context: ExecutionContext) =>
    requireMembership(context.switchToHttp().getRequest<Request>()),
);
