import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { normalizeEmail } from '../../common/utils/index.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByGsub(sub: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        googleSub: sub,
        deletedAt: null,
      },
    });
    return user;
  }

  async findSessionUserById(id: string) {
    return await this.prisma.user.findUniqueOrThrow({
      where: {
        id: id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true
      }
    });
  }

  // Usuario activo con ese correo (RF1). User.email no es único (D20): si hay varios, el que inició sesión más
  // recientemente (P18). Compara sin distinguir mayúsculas porque los correos viejos pueden no estar normalizados.
  async findMostRecentUserByEmail(email: string) {
    const latestSession = await this.prisma.session.findFirst({
      where: {
        user: {
          email: { equals: normalizeEmail(email), mode: 'insensitive' },
          deletedAt: null,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });
    return latestSession?.user ?? null;
  }

  async createUser(data: {
    email: string;
    name: string;
    googleSub: string;
    picture: string | undefined;
  }) {
    const response = await this.prisma.user.create({
      data: {
        email: normalizeEmail(data.email),
        name: data.name.trim(),
        googleSub: data.googleSub,
        avatarUrl: data.picture ?? null,
      },
    });

    return response;
  }
}

