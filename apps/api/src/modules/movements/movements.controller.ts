import { Body, Controller, Get,  Post, Query, UseFilters } from "@nestjs/common";
import { CreateMovementDto } from "./dto/CreateMovementDto.js";
import { MovementsService } from "./movements.service.js";
import { IndexMovementsPaginated } from "./dto/IndexMovementsPaginated.js";
import { Membership, Store } from "../../common/decorators/store.decorator.js";
import { User } from "../../common/decorators/user.decorator.js";
import type { StoreInfo, StoreMembership, UserInfo } from "../../common/types/express.js";
@Controller('movements')
export class MovementsController {
    constructor(private readonly service: MovementsService) {}

    @Post()
    async createMovement(
        @Body() createMovementDto: CreateMovementDto,
        @Membership() membership: StoreMembership,
        @User() user: UserInfo,
    ) {
        return await this.service.createMovement(createMovementDto, membership, user.id)
    }

    @Get()
    async getMovementsIndex(@Query() params: IndexMovementsPaginated, @Store() store: StoreInfo) {
        return await this.service.getMovemenetsPaginated(params, store.id);
    }
}