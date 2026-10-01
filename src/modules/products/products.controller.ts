import { Body, Controller, Post } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/CreateProductDto.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Post()
  async createProduct(@Body() productDto: CreateProductDto) {
    return this.service.createProduct(productDto);
  }
}
