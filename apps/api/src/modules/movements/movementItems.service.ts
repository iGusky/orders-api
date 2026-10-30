import { Injectable } from '@nestjs/common';
import { CreateMovementItemDto } from './dto/CreateMovementItemDto.js';
import { ProductsService } from '../products/products.service.js';
import {
  MovementDirectionType,
  MovementType,
} from '../../../generated/prisma/enums.js';
import type { Movement } from '../../../generated/prisma/client.js';
import { InsufficientStockError } from './exceptions/InsufficientStockError.js';
import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

@Injectable()
export class MovementItemService {
  constructor(
    private txHost: TransactionHost<TransactionalAdapterPrisma>,
    private productsService: ProductsService,
  ) {}

  @Transactional()
  async createAndAppendItem(item: CreateMovementItemDto, movement: Movement) {
    const product = await this.productsService.getProductById(item.productId);

    if (
      movement.type == MovementType.SALE ||
      movement.type == MovementType.SHRINKAGE ||
      (movement.type == MovementType.ADJUSTMENT &&
        movement.direction == MovementDirectionType.OUT)
    ) {
      if (product.stock < item.quantity)
        throw new InsufficientStockError(
          product.id,
          product.name,
          item.quantity,
          product.stock,
        );
      // Lógica para reducir el stock de un producto
      product.stock = product.stock - item.quantity;
    } else if (
      movement.type == MovementType.RESTOCK ||
      movement.type == MovementType.RETURN ||
      (movement.type == MovementType.ADJUSTMENT &&
        movement.direction == MovementDirectionType.IN)
    ) {
      // Lógica para aumentar el sotck del producto
      product.stock = product.stock + item.quantity;
    }

    await this.productsService.updateProduct(
      {
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        stock: product.stock,
      },
      product.id,
    );

    const movementItem = await this.txHost.tx.movementItem.create({
      data: {
        productId: item.productId,
        quantity: item.quantity,
        lineTotalCents: item.lineTotalCents,
        movementId: movement.id,
      },
    });

    return movementItem;
  }
}
