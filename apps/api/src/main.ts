import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(helmet());
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
}
bootstrap();
