import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/CreateProductDto.js';
import { IndexProductsDto } from './dto/IndexProductsPaginated.js';
import { Store } from '../../common/decorators/store.decorator.js';
import type { StoreInfo } from '../../common/types/express.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { StoreRole } from '../../../generated/prisma/enums.js';
import { UpdateProductDto } from './dto/UpdateProductDto.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  async getIndex(@Query() params: IndexProductsDto, @Store() store: StoreInfo) {
    return this.service.getAllProductsPaginated(params, store.id);
  }

  @Post()
  async createProduct(
    @Body() productDto: CreateProductDto,
    @Store() store: StoreInfo,
  ) {
    return this.service.createProduct(productDto, store.id);
  }

  @Get(':id')
  async getProductById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Store() store: StoreInfo,
  ) {
    return this.service.getProductById(id, store.id);
  }

  // Solo el dueño (P19, D32): un empleado recibe 403 ROLE_NOT_ALLOWED.
  @Patch(':id')
  @Roles([StoreRole.OWNER])
  async updateProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() changes: UpdateProductDto,
    @Store() store: StoreInfo,
  ) {
    return this.service.updateProduct(changes, id, store.id);
  }
}
