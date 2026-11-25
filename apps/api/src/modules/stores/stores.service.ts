import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { StoreRole } from '../../../generated/prisma/enums.js';
import { CreateStoreDto } from './dto/CreateStoreDto.js';
import { UserAlreadyHasStore } from './exceptions/UserAlreadyHasStore.js';
import type {
  MemberStore,
  StoreMembership,
} from '../../common/types/express.js';

// Columnas de StoreInfo: los datos del negocio que ve el cliente.
const STORE_INFO_SELECT = {
  id: true,
  name: true,
  address: true,
  contactEmail: true,
  description: true,
  phone: true,
} as const;

@Injectable()
export class StoresService {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  // Todas las tiendas activas de la persona con su rol (D26): primero la propia, luego por antigüedad.
  async getUserStores(userId: string): Promise<MemberStore[]> {
    const memberships = await this.txHost.tx.storeMember.findMany({
      where: { userId, store: { deletedAt: null } },
      select: { role: true, store: { select: STORE_INFO_SELECT } },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
    return memberships.map(({ store, role }) => ({ ...store, role }));
  }

  // Membresía de la persona en la tienda del header (D28). null si el id no es un UUID (evita un 500 de Postgres),
  // si no es miembro o si la tienda está borrada: el cliente no puede distinguir los casos (D19).
  async getMembership(
    storeId: string,
    userId: string,
  ): Promise<StoreMembership | null> {
    if (!isUUID(storeId)) return null;

    const membership = await this.txHost.tx.storeMember.findUnique({
      where: { storeId_userId: { storeId, userId } },
      select: {
        role: true,
        store: { select: { ...STORE_INFO_SELECT, deletedAt: true } },
      },
    });
    if (!membership || membership.store.deletedAt) return null;

    const { id, name, address, phone, description, contactEmail } = membership.store;
    return {
      store: { id, name, address, phone, description, contactEmail },
      role: membership.role,
    };
  }

  // Crea la tienda y la membresía OWNER de su dueño en la misma transacción (I17).
  @Transactional()
  async createStore(store: CreateStoreDto, ownerId: string) {
    const userStore = await this.txHost.tx.store.findFirst({
      where: {
        ownerId: ownerId,
        deletedAt: null,
      },
    });
    if (userStore) throw new UserAlreadyHasStore();

    return await this.txHost.tx.store.create({
      data: {
        name: store.name,
        address: store.address,
        ownerId: ownerId,
        phone: store.phone,
        contactEmail: store.contactEmail,
        description: store.description,
        members: {
          create: { userId: ownerId, role: StoreRole.OWNER },
        },
      },
    });
  }
}
