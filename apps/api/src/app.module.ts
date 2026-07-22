import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ProductsModule } from './modules/products/products.module';
import { ChallansModule } from './modules/challans/challans.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AppController } from './app.controller';

// __dirname = <root>/apps/api/dist/src at runtime
// 3 levels up from dist/src -> apps -> then web/dist
const webDistPath = join(__dirname, '..', '..', '..', 'web', 'dist');

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: webDistPath,
      exclude: ['/api*'],
      serveStaticOptions: {
        // SPA fallback: serve index.html for any route not found as a static file
        fallthrough: true,
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    ProductsModule,
    ChallansModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
