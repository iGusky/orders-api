import { Injectable } from '@nestjs/common';
import { GoogleLoginDto } from './dto/GoogleLoginDto.js';
import { OAuth2Client } from 'google-auth-library';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { UsersService } from '../users/users.service.js';
import { SessionsService } from '../sessions/sessions.service.js';

const client = new OAuth2Client();

@Injectable()
export class AuthService {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
    private readonly usersService: UsersService,
    private readonly sessionService: SessionsService,
  ) {}

  async initSession({ credential }: GoogleLoginDto): Promise<{
        expiresAt: Date;
        token: string;
      }
  > {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) throw new Error('');

    let user = await this.usersService.findUserByGsub(payload.sub);

    // Si no se encontró el usuario: crearlo
    if (user == null) {
      const { email, name, sub, picture } = payload;

      if (!email || !name ) throw new Error('');

      user = await this.usersService.createUser({
        email: email,
        name: name,
        googleSub: sub,
        picture: picture,
      });
    }

    const session = await this.sessionService.createSession(user.id);
    return session;
  }
}
