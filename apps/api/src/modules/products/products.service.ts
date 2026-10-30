import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/CreateProductDto.js';
import { ProductsIndexParamsDto } from './dto/ProductsIndexParamsDto.js';
import { ProductWhereInput } from '../../../generated/prisma/models.js';
import { Product } from '../../../generated/prisma/client.js';
import { ProductNotFoundError } from './exceptions/ProductNotFoundError.js';
import { UpdateProductDto } from './dto/UpdateProductDto.js';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

@Injectable()
export class ProductsService {
  constructor(private readonly txHost: TransactionHost<TransactionalAdapterPrisma>) {}

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
      this.txHost.tx.product.findMany({
            where,
            orderBy: {id: 'desc'},
            take: perPage,
            skip: itemsToSkip
          }),
      this.txHost.tx.product.count({where})
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
    const result = await this.txHost.tx.product.create({
      data: {
        name: product.name,
        priceCents: product.priceCents,
        description: product.description
      },
    });
    return result;
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.txHost.tx.product.findUnique({where: { id: id.trim(), deletedAt: null }})
    if(!product) throw new ProductNotFoundError(id)
    return product;
  }

  async updateProduct(newProductData: UpdateProductDto, id: string) {
    return await this.txHost.tx.product.update({
      where: {id},
      data: {
        ...newProductData
      }
    })
  }
}
