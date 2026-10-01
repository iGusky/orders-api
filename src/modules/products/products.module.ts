import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';

@Module({
  providers: [ProductsService],
  controllers: [ProductsController],
  imports: [PrismaModule],
})
export class ProductModule {}
