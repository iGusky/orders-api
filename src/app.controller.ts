import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AppService } from './app.service.js';
import {CreateOrderDto} from './models/CreateOrderDto.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getOrders() {
    return this.appService.getOrders();
  }

  @Get(':id')
  getOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.appService.getOrderById(id)
  }

  @Post()
  createOrder(@Body() orderDto: CreateOrderDto){
    return this.appService.createOrder(orderDto)
  }
}
