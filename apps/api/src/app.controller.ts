import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import { CreateOrderDto } from './modules/orders/models/CreateOrderDto.js';

@Controller()
export class AppController {}
