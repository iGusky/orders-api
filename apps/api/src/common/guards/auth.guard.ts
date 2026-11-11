import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { SessionsService } from '../../modules/sessions/sessions.service.js';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../modules/users/users.service.js';
import { StoresService } from '../../modules/stores/stores.service.js';
import { SessionNotFoundError } from '../../modules/auth/exceptions/SessionNotFoundException.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly service: SessionsService,
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly storesService: StoresService
  ) {}

  async canActivate(context: ExecutionContext) {
    if (this.reflector.get<boolean>('isPublic', context.getHandler()))
      return true;
    
    const request = context.switchToHttp().getRequest();
    const sessionToken = request.cookies.session
    if(!sessionToken) throw new SessionNotFoundError();

    const session = await this.service.getSessionData(sessionToken);

    const [user, store] = await Promise.all([
      this.usersService.findSessionUserById(session.userId),
      this.storesService.getUserStore(session.userId)
    ])

    request.user = user;
    request.store = store;
    return true;
  }
}
