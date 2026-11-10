import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateStoreDto } from './dto/CreateStoreDto.js';

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

  async createStore(store: CreateStoreDto, ownerId: string) {
    return await this.service.store.create({
      data: {
        name: store.name,
        address: store.address,
        ownerId: ownerId,
        phone: store.phone,
        contactEmail: store.contactEmail,
        description: store.description
      }
    })
  }
}
