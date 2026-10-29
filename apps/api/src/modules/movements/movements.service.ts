import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateMovementDto } from './dto/CreateMovementDto.js';
import { MovementItemService } from './movementItems.service.js';
import { IndexParamsDto } from '../../common/models/IndexParamsDto.js';
import { MovementType } from '../../../generated/prisma/enums.js';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

@Injectable()
export class MovementsService {
  constructor(
    private txHost: TransactionHost<TransactionalAdapterPrisma>,
    private movementItermsService: MovementItemService,
  ) {}

  @Transactional()
  async createMovement(data: CreateMovementDto) {
    var totalCents = 0;

    if (MovementType.SALE == data.type) {
      data.items.forEach((i) => {
        totalCents += i.lineTotalCents;
      });
    }

    const movement = await this.txHost.tx.movement.create({
      data: {
        type: data.type,
        direction: data.direction,
        totalCents: totalCents,
        occurredAt: data.ocurredAt ?? new Date(),
      },
    });
    
    for (const item of data.items) {
      await this.movementItermsService.createAndAppendItem(item, movement);
    }
    return movement;
  
  }

  async getMovemenetsPaginated({ perPage, page, search }: IndexParamsDto) {
    const itemsToSkip = perPage * (page - 1);

    const [movements, totalItems] = await Promise.all([
      this.txHost.tx.movement.findMany({
        orderBy: { id: 'desc' },
        take: perPage,
        skip: itemsToSkip,
      }),
      this.txHost.tx.movement.count(),
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
