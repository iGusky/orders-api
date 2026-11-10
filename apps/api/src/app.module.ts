import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductModule } from './modules/products/products.module.js';
import { MovementsModule } from './modules/movements/movements.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { APP_FILTER } from '@nestjs/core';
import { DomainErrorFilter } from './common/filters/domain-error.filter.js';
import { ClsModule } from 'nestjs-cls';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { PrismaService } from './prisma/prisma.service.js';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { UsersModule } from './modules/users/users.module.js';
import { StoresModule } from './stores/stores.module.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    ProductModule,
    MovementsModule,
    AuthModule,
    UsersModule,
    ClsModule.forRoot({
      plugins: [
        new ClsPluginTransactional({
          imports: [
            PrismaModule,
          ],
          adapter: new TransactionalAdapterPrisma({
            prismaInjectionToken: PrismaService,
            sqlFlavor: 'postgresql',
          }),
        }),
      ],
    }),
    StoresModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: DomainErrorFilter,
    },
  ],
})
export class AppModule {}
