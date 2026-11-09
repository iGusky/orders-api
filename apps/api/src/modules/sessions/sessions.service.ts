import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { SESSION_DAYS_LIMIT } from '../../common/constants/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SessionsService {

  constructor(private readonly prisma: PrismaService) {}

  async createSession(userId: string) {
    const token = randomBytes(32).toString('base64url')
    const hashedToken = this.hashToken(token)

    var date = new Date()
    date.setDate(date.getDate() + SESSION_DAYS_LIMIT);
  
    await this.prisma.session.create({
      data: {
        expiresAt: date.toISOString(),
        tokenHash: hashedToken,
        userId: userId
      }
    })

    return {
      expiresAt: date,
      token
    }
  }

  hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }
}
