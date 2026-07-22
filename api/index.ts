import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../apps/api/src/app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { GlobalHttpExceptionFilter } from '../apps/api/src/common/filters/http-exception.filter';
import cookieParser from 'cookie-parser';

const server = express();
let cachedServer: any;

async function bootstrapServerless() {
  if (!cachedServer) {
    server.use(express.json({ limit: '10mb' }));
    server.use(express.urlencoded({ extended: true, limit: '10mb' }));
    server.use(cookieParser());

    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      { logger: ['error', 'warn', 'log'] }
    );

    app.setGlobalPrefix('api');

    app.enableCors({
      origin: true,
      credentials: true,
    });

    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new GlobalHttpExceptionFilter());

    await app.init();
    cachedServer = server;
  }
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  try {
    const instance = await bootstrapServerless();
    instance(req, res);
  } catch (err: any) {
    console.error('🚀 Vercel Serverless Function Bootstrap Error:', err);
    res.status(500).json({
      statusCode: 500,
      message: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    });
  }
}
