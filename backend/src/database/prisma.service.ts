import 'dotenv/config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    // PrismaPg'nin bu yerel PostgreSQL kurulumu ile birden fazla bağlantıda
    // prepared-statement protokol hatası (08P01/P2039) verdiği doğrulandı.
    // İstekler yine async olarak kuyruklanır; tek bağlantı veri tutarlılığını korur.
    const poolMax = Number(process.env.DATABASE_POOL_MAX ?? '1');

    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured.');
    }

    if (!Number.isInteger(poolMax) || poolMax < 1) {
      throw new Error('DATABASE_POOL_MAX must be a positive integer.');
    }

    super({ adapter: new PrismaPg({ connectionString, max: poolMax }) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
