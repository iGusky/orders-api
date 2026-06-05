import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from '../models/CreateOrderDto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrdersService {

  constructor(private prisma: PrismaService){}

  async getOrders() {
    const orders = await this.prisma.order.findMany();
    return orders;
  }

  async getOrderById(id: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: id,
      },
    });
    return order;
  }

  async createOrder(orderDto: CreateOrderDto) {
    const order = await this.prisma.order.create({
      data: {
        product: orderDto.product,
        total: orderDto.total,
      },
    });

    return order;
  }
}
