import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from '../models/CreateOrderDto.js';

@Controller('orders')
export class OrdersController {

  constructor(private readonly service: OrdersService) {}

  @Get()
  getOrders() {
    return this.service.getOrders();
  }

  @Get(':id')
  getOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getOrderById(id);
  }

  @Post()
  createOrder(@Body() orderDto: CreateOrderDto) {
    return this.service.createOrder(orderDto);
  }
}
