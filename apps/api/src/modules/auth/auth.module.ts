import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GoogleTokenVerifier } from './google-token-verifier.js';

@Module({
  imports: [ConfigModule, UsersModule, SessionsModule],
  controllers: [AuthController],
  providers: [AuthService, GoogleTokenVerifier],
})
export class AuthModule {}
