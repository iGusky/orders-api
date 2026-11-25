import { Prisma } from '../../../generated/prisma/client.js';
import { ProductsService } from './products.service.js';
import { ProductNotFoundError } from './exceptions/ProductNotFoundError.js';
import type { UpdateProductDto } from './dto/UpdateProductDto.js';

const PRODUCT_ID = '019a0000-0000-7000-8000-000000000001';
const STORE_ID = '019a0000-0000-7000-8000-0000000000aa';

describe('ProductsService.updateProduct (D32)', () => {
  let update: jest.Mock;
  let service: ProductsService;

  beforeEach(() => {
    update = jest.fn().mockResolvedValue({ id: PRODUCT_ID });
    const txHost = { tx: { product: { update } } };
    service = new ProductsService(txHost as never);
  });

  it('only matches an active product of the active store (I13, D19, D7)', async () => {
    await service.updateProduct({ name: 'Sticker' }, PRODUCT_ID, STORE_ID);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PRODUCT_ID, storeId: STORE_ID, deletedAt: null },
      }),
    );
  });

  it('never writes stock, even if the body carries it (D2)', async () => {
    const body = {
      name: 'Sticker',
      priceCents: 900,
      description: null,
      stock: 9999,
    } as UpdateProductDto;

    await service.updateProduct(body, PRODUCT_ID, STORE_ID);

    const { data } = update.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(data).not.toHaveProperty('stock');
    expect(data).toEqual({
      name: 'Sticker',
      priceCents: 900,
      description: null,
    });
  });

  it('leaves omitted fields untouched (undefined for Prisma)', async () => {
    await service.updateProduct({ priceCents: 1200 }, PRODUCT_ID, STORE_ID);

    const { data } = update.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(data).toEqual({
      name: undefined,
      description: undefined,
      priceCents: 1200,
    });
  });

  it('answers PRODUCT_NOT_FOUND when Prisma finds no row (other store, deleted or missing)', async () => {
    update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'No record was found for an update.',
        {
          code: 'P2025',
          clientVersion: 'test',
        },
      ),
    );

    await expect(
      service.updateProduct({ name: 'x' }, PRODUCT_ID, STORE_ID),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});

describe('ProductsService.setStock', () => {
  it('writes only the stock column, so it cannot revert a concurrent edit (D32)', async () => {
    const update = jest.fn().mockResolvedValue({});
    const service = new ProductsService({
      tx: { product: { update } },
    } as never);

    await service.setStock(PRODUCT_ID, STORE_ID, 7);

    expect(update).toHaveBeenCalledWith({
      where: { id: PRODUCT_ID, storeId: STORE_ID },
      data: { stock: 7 },
    });
  });
});
