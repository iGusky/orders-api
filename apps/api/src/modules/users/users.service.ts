import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

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

  async createUser(data: {
    email: string;
    name: string;
    googleSub: string;
    picture: string | undefined;
  }) {
    const response = await this.prisma.user.create({
      data: {
        email: data.email.trim(),
        name: data.name.trim(),
        googleSub: data.googleSub,
        avatarUrl: data.picture ?? null,
      },
    });

    return response;
  }
}
