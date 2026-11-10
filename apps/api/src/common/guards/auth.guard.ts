import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { SessionsService } from '../../modules/sessions/sessions.service.js';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private readonly service: SessionsService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ) {
    const request = context.switchToHttp().getRequest();
    return this.service
      .getSessionData(request.cookies.session)
      .then(() => {
        return true;
      }).catch( () => {
          throw new HttpException('Session not found', HttpStatus.UNAUTHORIZED)
      })
  }
}
