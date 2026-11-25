import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductModule } from './modules/products/products.module.js';
import { MovementsModule } from './modules/movements/movements.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { DomainErrorFilter } from './common/filters/domain-error.filter.js';
import { ClsModule } from 'nestjs-cls';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { PrismaService } from './prisma/prisma.service.js';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { UsersModule } from './modules/users/users.module.js';
import { StoresModule } from './modules/stores/stores.module.js';
import { AuthGuard } from './common/guards/auth.guard.js';
import { SessionsModule } from './modules/sessions/sessions.module.js';
import { MembersModule } from './modules/members/members.module.js';
import { StoreRoleGuard } from './common/guards/store-role.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    ProductModule,
    MovementsModule,
    AuthModule,
    UsersModule,
    SessionsModule,
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
    MembersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: DomainErrorFilter,
    },
    // Los guards globales corren en este orden: primero la sesión y la tienda, después el rol (D30).
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: StoreRoleGuard
    }
  ],
})
export class AppModule {}
