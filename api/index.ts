import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../apps/api/src/app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { GlobalHttpExceptionFilter } from '../apps/api/src/common/filters/http-exception.filter';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

const expressApp = express();
let cachedServer: any;

async function bootstrapServerless() {
  if (!cachedServer) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    app.setGlobalPrefix('api');
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(cookieParser());

    app.enableCors({
      origin: true,
      credentials: true,
    });

    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new GlobalHttpExceptionFilter());

    await app.init();
    cachedServer = expressApp;
  }
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrapServerless();
  server(req, res);
}
