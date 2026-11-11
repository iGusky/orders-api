import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { GoogleLoginDto } from './dto/GoogleLoginDto.js';
import { type Response } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('/google')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async initSession(@Body() loginDto: GoogleLoginDto, @Res({ passthrough: true }) res: Response) {
    const session = await this.service.initSession(loginDto)

    res.cookie('session', session.token, {
      httpOnly: true,
      expires: session.expiresAt,
      secure: true,
      sameSite: 'strict',
    })
    return
  }
}
