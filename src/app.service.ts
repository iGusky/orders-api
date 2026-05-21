import { Injectable } from '@nestjs/common';
import { prisma } from "../lib/prisma.js"
@Injectable()
export class AppService {

  async getOrders() {
    const orders = await prisma.order.findMany()
    await prisma.$disconnect()
    return orders
  }

  async getOrderById(id: number) {
    const order = await prisma.order.findFirst({
      where: {
        id: id
      }
    })
    await prisma.$disconnect()
    return order
  }

  async createOrder(){
    const order = await prisma.order.create({
      data: {
        product: 'iPhone 15',
        total: 499
      }
    })

    return order
  }
}
