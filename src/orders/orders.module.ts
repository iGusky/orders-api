import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  providers: [OrdersService, PrismaService],
  controllers: [OrdersController],
  imports: [PrismaModule]
})
export class OrdersModule {}
