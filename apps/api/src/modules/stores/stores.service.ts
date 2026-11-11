import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateStoreDto } from './dto/CreateStoreDto.js';
import { UserAlreadyHasStore } from './exceptions/UserAlreadyHasStore.js';
import { StoreInfo } from '../../common/types/express.js';

@Injectable()
export class StoresService {

  constructor(
    private readonly service: PrismaService
  ) {}

  async getUserStore(userId: string): Promise<StoreInfo | null> {
    return await this.service.store.findFirst({
      where: {
        ownerId: userId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        address: true,
        contactEmail: true,
        description: true,
        phone: true
      }
    })
  }

  async createStore(store: CreateStoreDto, ownerId: string) {
    const userStore = await this.service.store.findFirst({
      where: {
        ownerId: ownerId,
        deletedAt: null
      }
    })
    if(userStore) throw new UserAlreadyHasStore()

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
