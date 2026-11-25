import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { GoogleLoginDto } from './dto/GoogleLoginDto.js';
import { type Request, type Response } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
} from '../../common/constants/index.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('/google')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async initSession(
    @Body() loginDto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.service.initSession(loginDto);

    res.cookie(SESSION_COOKIE, session.token, {
      ...SESSION_COOKIE_OPTIONS,
      expires: session.expiresAt,
    });
    return;
  }

  // Público e idempotente (D24): sin cookie, o con una sesión vencida o ya revocada, también responde 204 y borra
  // la cookie. Así "Cerrar sesión" siempre deja al navegador sin sesión, en lugar de fallar con 401.
  @Post('/logout')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async closeSession(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string | undefined>;
    await this.service.closeSession(cookies[SESSION_COOKIE]);

    res.clearCookie(SESSION_COOKIE, SESSION_COOKIE_OPTIONS);
    return;
  }
}
