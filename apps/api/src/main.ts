import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    transform: true
  }))

  // CORS_ORIGIN: orígenes permitidos separados por coma (en producción, https://bazar.gushm.dev).
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true
  })

  // Cierra conexiones (Prisma) cuando Docker/Dokploy detiene el contenedor (SIGTERM).
  app.enableShutdownHooks()

  app.use(cookieParser())

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
