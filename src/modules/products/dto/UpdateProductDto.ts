export class UpdateProductDto {
    name!: string;
    description!: string | null;
    stock!: number;
    priceCents!: number;
}