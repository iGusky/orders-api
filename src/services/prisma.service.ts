import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {

    constructor() {
        const connectionString = process.env.DATABASE_URL
        const adapter = new PrismaBetterSqlite3({ url: connectionString})
        super({adapter})
    }

    async onModuleInit() {
        await this.$connect()
    }
}