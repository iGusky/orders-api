import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  private orders = [
    { id: 1, product: 'Laptop', total: 999 },
    { id: 2, product: 'Mouse', total: 29 }
  ]

  getOrders() {
    return this.orders
  }

  getOrderById(id: number) {
    return this.orders.find(order => order.id == id)
  }
}
