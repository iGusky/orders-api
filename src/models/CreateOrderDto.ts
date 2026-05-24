export class CreateOrderDto {
    product: string;
    total: number

    constructor(product: string, total: number) {
        this.product = product
        this.total = total
    }
}
