import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { existsSync } from 'fs';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve built React SPA BEFORE global prefix is applied so /api/* is not intercepted
  // __dirname = .../apps/api/dist/src → 3 levels up = apps/ → web/dist
  const webDistPath = join(__dirname, '..', '..', '..', 'web', 'dist');
  if (existsSync(webDistPath)) {
    // Serve static assets (JS, CSS, images)
    app.useStaticAssets(webDistPath);
    // SPA fallback: serve index.html for all non-API routes
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) return next();
      const indexPath = join(webDistPath, 'index.html');
      return res.sendFile(indexPath);
    });
  }

  app.setGlobalPrefix('api');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());

  app.enableCors({
    origin: !process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN,
    credentials: true,
  });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Mini ERP + CRM Operations Portal API')
    .setDescription('Master technical specification API for Wholesale & Distribution operations')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Mini ERP API server listening on http://localhost:${port}`);
  console.log(`📚 Swagger OpenAPI documentation available at http://localhost:${port}/api/docs`);
  console.log(`🌐 React Frontend served from: ${existsSync(webDistPath) ? webDistPath : 'NOT FOUND'}`);
}
bootstrap();
