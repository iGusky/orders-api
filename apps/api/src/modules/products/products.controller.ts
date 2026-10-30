import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseFilters } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/CreateProductDto.js';
import { IndexProductsDto } from './dto/IndexProductsPaginated.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  async getIndex(@Query() params: IndexProductsDto) {
    return this.service.getAllProductsPaginated(params);
  }

  @Post()
  async createProduct(@Body() productDto: CreateProductDto) {
    return this.service.createProduct(productDto);
  }

  @Get(':id')
  async getProductById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.getProductById(id)
  }
}
