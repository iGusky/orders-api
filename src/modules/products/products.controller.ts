import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseFilters } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/CreateProductDto.js';
import { IndexParamsDto } from '../../common/models/IndexParamsDto.js';
import { DomainErrorFilter } from '../../common/filters/domain-error.filter.js';

@Controller('products')
@UseFilters(DomainErrorFilter)
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  async getIndex(@Query() params: IndexParamsDto) {
    return this.service.getAllProductsPaginated(params);
  }

  @Post()
  async createProduct(@Body() productDto: CreateProductDto) {
    return this.service.createProduct(productDto);
  }

  @Get(':id')
  async getProductById(@Param('id', new ParseUUIDPipe()) id: string) {
    try {
      return this.service.getProductById(id)
    } catch(e) {
      throw e
    }
  }
}
