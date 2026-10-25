import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ProductsService } from "../products/products.service.js";
import { CreateMovementDto } from "./dto/CreateMovementDto.js";
import { MovementsService } from "./movements.service.js";
import { IndexParamsDto } from "../../common/models/IndexParamsDto.js";

@Controller('movements')
export class MovementsController {
    constructor(private readonly service: MovementsService) {}

    @Post()
    async createMovement(@Body() createMovementDto: CreateMovementDto) {
        const response = await this.service.createMovement(createMovementDto)
    }

    @Get()
    async getMovementsIndex(@Query() params: IndexParamsDto) {
        return await this.service.getMovemenetsPaginated(params);
    }
}