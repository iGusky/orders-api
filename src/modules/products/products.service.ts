import { PrismaService } from '../../prisma/prisma.service.js';
import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/CreateProductDto.js';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

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
