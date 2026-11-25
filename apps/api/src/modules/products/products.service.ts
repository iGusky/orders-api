import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/CreateProductDto.js';
import { ProductsIndexParamsDto } from './dto/ProductsIndexParamsDto.js';
import { ProductWhereInput } from '../../../generated/prisma/models.js';
import { Prisma, Product } from '../../../generated/prisma/client.js';
import { ProductNotFoundError } from './exceptions/ProductNotFoundError.js';
import { UpdateProductDto } from './dto/UpdateProductDto.js';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';

@Injectable()
export class ProductsService {
  constructor(
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
  ) {}

  async getAllProductsPaginated(
    { search, page, perPage }: ProductsIndexParamsDto,
    storeId: string,
  ) {
    const itemsToSkip = perPage * (page - 1);

    const where: ProductWhereInput = {
      name: {
        contains: search,
        mode: 'insensitive',
      },
      storeId: storeId,
      deletedAt: null,
    };

    const [products, totalItems] = await Promise.all([
      this.txHost.tx.product.findMany({
        where,
        orderBy: { id: 'desc' },
        take: perPage,
        skip: itemsToSkip,
      }),
      this.txHost.tx.product.count({ where }),
    ]);

    return {
      page: page,
      perPage: perPage,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / perPage),
      data: products,
    };
  }

  async createProduct(product: CreateProductDto, storeId: string) {
    const result = await this.txHost.tx.product.create({
      data: {
        name: product.name,
        priceCents: product.priceCents,
        description: product.description,
        storeId: storeId,
      },
    });
    return result;
  }

  async getProductById(id: string, storeId): Promise<Product> {
    const product = await this.txHost.tx.product.findUnique({
      where: { id: id.trim(), storeId: storeId, deletedAt: null },
    });
    if (!product) throw new ProductNotFoundError(id);
    return product;
  }

  // Lo usa MovementItemService dentro de su transacción. Escribe solo `stock` para no pisar un nombre o precio que el
  // dueño haya editado entre la lectura del producto y esta escritura (D32). La validación de stock contra peticiones
  // simultáneas sigue pendiente (I2, docs/pendientes.md).
  async setStock(id: string, storeId: string, stock: number): Promise<void> {
    await this.txHost.tx.product.update({
      where: { id, storeId },
      data: { stock },
    });
  }

  // D32: nombre, precio de lista y descripción. Un solo UPDATE que no toca `stock`, así que no compite con los
  // movimientos (I2): Postgres bloquea la fila lo que dura la sentencia y cada lado solo escribe sus columnas.
  async updateProduct(
    changes: UpdateProductDto,
    id: string,
    storeId: string,
  ): Promise<Product> {
    try {
      return await this.txHost.tx.product.update({
        // storeId (I13, D19) y deletedAt (D7) en el where: de otra tienda o borrado es igual que inexistente.
        where: { id, storeId, deletedAt: null },
        data: {
          name: changes.name,
          description: changes.description,
          priceCents: changes.priceCents,
        },
      });
    } catch (error) {
      if (isRecordNotFound(error)) throw new ProductNotFoundError(id);
      throw error;
    }
  }
}

function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}
