import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class StoresService {

  constructor(private readonly service: PrismaService) {}

  async getUserStore(userId: string) {
    return await this.service.store.findFirst({
      where: {
        ownerId: userId,
        deletedAt: null
      }
    })
  }
}
