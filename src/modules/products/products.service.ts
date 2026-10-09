import { PrismaService } from '../../prisma/prisma.service.js';
import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/CreateProductDto.js';
import { ProductsIndexParamsDto } from './dto/ProductsIndexParamsDto.js';
import { ProductWhereInput } from '../../../generated/prisma/models.js';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getAllProductsPaginated({ search, page, perPage }: ProductsIndexParamsDto) {
    
    const itemsToSkip = perPage * (page - 1)

    const where: ProductWhereInput = {
      name: {
        contains: search,
        mode: 'insensitive'
      },
      deletedAt: null
    }

    const [products, totalItems] = await Promise.all([
      this.prisma.product.findMany({
            where,
            orderBy: {id: 'desc'},
            take: perPage,
            skip: itemsToSkip
          }),
      this.prisma.product.count({where})
    ])
    
    return {
      page: page,
      perPage: perPage,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems/perPage),
      data: products,
    }
  }

  async createProduct(product: CreateProductDto) {
    const result = await this.prisma.product.create({
      data: {
        name: product.name,
        priceCents: product.priceCents,
        description: product.description
      },
    });
    return result;
  }
}
