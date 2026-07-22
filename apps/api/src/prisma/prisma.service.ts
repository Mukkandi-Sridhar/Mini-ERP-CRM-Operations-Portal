import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const defaultUrl =
  'postgresql://neondb_owner:npg_hMIDJAN6ol0t@ep-misty-cherry-azdjzd8h-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const connectionUrl =
  process.env.NODE_ENV === 'test'
    ? process.env.DATABASE_URL || 'postgresql://sridhar@localhost:5432/mini_erp_db?schema=public'
    : process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
      ? process.env.DATABASE_URL
      : defaultUrl;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: connectionUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
