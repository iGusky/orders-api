import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseFilters } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/CreateProductDto.js';
import { IndexProductsDto } from './dto/IndexProductsPaginated.js';
import { Store } from '../../common/decorators/store.decorator.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  async getIndex(@Query() params: IndexProductsDto, @Store() store) {
    return this.service.getAllProductsPaginated(params, store.id);
  }

  @Post()
  async createProduct(@Body() productDto: CreateProductDto, @Store() store) {
    return this.service.createProduct(productDto, store.id);
  }

  @Get(':id')
  async getProductById(@Param('id', new ParseUUIDPipe()) id: string, @Store() store) {
    return this.service.getProductById(id, store.id)
  }
}
