import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Roles } from '../decorators/roles.decorator.js';
import { requireMembership } from '../decorators/store.decorator.js';
import { RoleNotAllowedError } from '../exceptions/RoleNotAllowedError.js';

// Global, después de AuthGuard (orden de registro en AppModule). Solo actúa en endpoints con @Roles: exige tienda
// activa y que el rol de la persona en ella esté en la lista. Las reglas que dependen del body (un ADJUSTMENT) no
// caben aquí y viven en el service.
@Injectable()
export class StoreRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) return true;

    const { role } = requireMembership(
      context.switchToHttp().getRequest<Request>(),
    );
    if (!roles.includes(role)) throw new RoleNotAllowedError();
    return true;
  }
}
