import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AppService } from './app.service.js';

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
  createOrder(){
    return this.appService.createOrder()
  }
}
