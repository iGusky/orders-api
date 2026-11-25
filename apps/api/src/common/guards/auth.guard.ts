import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { SessionsService } from '../../modules/sessions/sessions.service.js';
import { UsersService } from '../../modules/users/users.service.js';
import { StoresService } from '../../modules/stores/stores.service.js';
import { SessionNotFoundError } from '../../modules/auth/exceptions/SessionNotFoundException.js';
import { SESSION_COOKIE, STORE_HEADER } from '../constants/index.js';

// Global (D21): toda petición necesita sesión salvo @Public(). Carga a la persona y, si el cliente mandó
// X-Store-Id, su membresía en esa tienda (D28). La pertenencia se comprueba en cada petición, sin caché (I20).
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly service: SessionsService,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly storesService: StoresService,
  ) {}

  async canActivate(context: ExecutionContext) {
    if (this.reflector.get<boolean>('isPublic', context.getHandler()))
      return true;

    const request = context.switchToHttp().getRequest<Request>();
    const cookies = request.cookies as Record<string, string | undefined>;
    const sessionToken = cookies[SESSION_COOKIE];
    if (!sessionToken) throw new SessionNotFoundError();

    const session = await this.service.getSessionData(sessionToken);
    const requestedStoreId = request.header(STORE_HEADER) || null;

    const [user, membership] = await Promise.all([
      this.usersService.findSessionUserById(session.userId),
      requestedStoreId
        ? this.storesService.getMembership(requestedStoreId, session.userId)
        : null,
    ]);

    request.user = user;
    request.storeContext = { requestedStoreId, membership };
    return true;
  }
}
