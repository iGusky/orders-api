import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/CreateProductDto.js';
import { ProductsIndexParamsDto } from './dto/ProductsIndexParamsDto.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  async getIndex(@Query() params: ProductsIndexParamsDto) {
    return this.service.getAllProductsPaginated(params);
  }

  @Post()
  async createProduct(@Body() productDto: CreateProductDto) {
    return this.service.createProduct(productDto);
  }
}
