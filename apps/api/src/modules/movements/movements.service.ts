import { Injectable } from '@nestjs/common';
import { CreateMovementDto } from './dto/CreateMovementDto.js';
import { MovementItemService } from './movementItems.service.js';
import { IndexMovementsPaginated } from './dto/IndexMovementsPaginated.js';
import { MovementType, StoreRole } from '../../../generated/prisma/enums.js';
import { RoleNotAllowedError } from '../../common/exceptions/RoleNotAllowedError.js';
import type { StoreMembership } from '../../common/types/express.js';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { CreateMovementItemDto } from './dto/CreateMovementItemDto.js';

@Injectable()
export class MovementsService {
  constructor(
    private txHost: TransactionHost<TransactionalAdapterPrisma>,
    private movementItermsService: MovementItemService,
  ) {}

  // `membership` es la tienda activa y el rol de quien registra; `userId`, su autor (D31).
  @Transactional()
  async createMovement(data: CreateMovementDto, { store, role }: StoreMembership, userId: string) {
    // Solo el dueño registra ajustes (RF6, I18). Depende del body, por eso no es un @Roles del controller.
    if (data.type === MovementType.ADJUSTMENT && role !== StoreRole.OWNER) throw new RoleNotAllowedError();

    const storeId = store.id;
    var totalCents = 0;

    if (data.type == MovementType.SALE || data.type == MovementType.RETURN) {
      data.items.forEach((i) => {
        totalCents += i.lineTotalCents;
      });
    }

    const movement = await this.txHost.tx.movement.create({
      data: {
        type: data.type,
        direction: data.direction,
        totalCents: totalCents,
        occurredAt: data.occurredAt ?? new Date(),
        storeId: storeId,
        createdById: userId,
      },
    });

    data.items.sort((a: CreateMovementItemDto,b: CreateMovementItemDto) => {
      if( a.productId < b.productId ) return -1
      if( a.productId > b.productId ) return 1
      return 0
    })

    for (const item of data.items) {
      await this.movementItermsService.createAndAppendItem(item, movement, storeId);
    }
    return movement;
  }

  async getMovemenetsPaginated({
    perPage,
    page,
    type,
    direction,
    dateStart,
    dateEnd,
  }: IndexMovementsPaginated, storeId: string) {
    
    const itemsToSkip = perPage * (page - 1);
    const where = {
      type,
      direction: type == MovementType.ADJUSTMENT ? direction : undefined,
      storeId: storeId,
      occurredAt: {
        gte: dateStart,
        lte: dateEnd,
      },
    };

    const [movements, totalItems] = await Promise.all([
      this.txHost.tx.movement.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true } },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              id: 'desc',
            },
          },
        },
        orderBy: { id: 'desc' },
        take: perPage,
        skip: itemsToSkip,
      }),
      this.txHost.tx.movement.count({
        where,
      })
    ]);

    return {
      page: page,
      perPage: perPage,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / perPage),
      data: movements,
    };
  }
}
