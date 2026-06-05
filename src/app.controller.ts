import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AppService } from './app.service.js';
import {CreateOrderDto} from './models/CreateOrderDto.js';

@Controller()
export class AppController {}
