import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const defaultUrl =
  'postgresql://neondb_owner:npg_hMIDJAN6ol0t@ep-misty-cherry-azdjzd8h.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

function getSanitizedDbUrl(): string {
  if (process.env.NODE_ENV === 'test') {
    return process.env.DATABASE_URL || 'postgresql://sridhar@localhost:5432/mini_erp_db?schema=public';
  }

  let url = process.env.DATABASE_URL || defaultUrl;
  if (!url || url.includes('localhost')) {
    url = defaultUrl;
  }

  if (url.includes('-pooler') && !url.includes('pgbouncer=')) {
    url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true&connect_timeout=30';
  }

  return url;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: getSanitizedDbUrl(),
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
