import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    transform: true
  }))

  app.enableCors({
    origin: "http://localhost:4200",
    credentials: true
  })

  app.use(cookieParser())

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
