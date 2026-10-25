import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CreateMovementItemDto } from "./dto/CreateMovementItemDto.js";
import { ProductsService } from "../products/products.service.js";

@Injectable()
export class MovementItemService {
    constructor(private prisma: PrismaService, private productsService: ProductsService) {}
    async createAndAppendItem(item: CreateMovementItemDto, movementId: string) {
        const result = await this.prisma.movementItem.create({
            data: {
                productId: item.productId,
                quantity: item.quantity,
                lineTotalCents: item.lineTotalCents,
                movementId: movementId
            }
        })
        return result
    }
}