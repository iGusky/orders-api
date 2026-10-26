import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { CreateMovementItemDto } from "./dto/CreateMovementItemDto.js";
import { ProductsService } from "../products/products.service.js";
import { MovementDirectionType, MovementType } from "../../../generated/prisma/enums.js";
import type { Movement } from "../../../generated/prisma/client.js";
import { ProductNotFoundError } from "../products/exceptions/ProductNotFoundError.js";
import { InsufficientStockError } from "./exceptions/InsufficientStockError.js";

@Injectable()
export class MovementItemService {
    constructor(private prisma: PrismaService, private productsService: ProductsService) {}
    async createAndAppendItem(item: CreateMovementItemDto, movement: Movement) {
        const product = await this.productsService.getProductById(item.productId);
        
        if(!product) throw new ProductNotFoundError(item.productId)

        const movementItem = await this.prisma.movementItem.create({
            data: {
                productId: item.productId,
                quantity: item.quantity,
                lineTotalCents: item.lineTotalCents,
                movementId: movement.id
            }
        })

        if(MovementType.SALE == movement.type ||  
            (
                movement.type == MovementType.ADJUSTMENT 
                && movement.direction == MovementDirectionType.OUT
            ) 
        )
        {
            if(product.stock < item.quantity) throw new InsufficientStockError(
                product.id,
                product.name,
                movementItem.quantity,
                product.stock
            )
            // Lógica para reducir el stock de un producto
        }


        return movementItem
    }
}