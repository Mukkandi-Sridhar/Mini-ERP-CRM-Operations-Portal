import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MovementType, Role } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('ProductsService - Stock Concurrency & Ledger', () => {
  let service: ProductsService;
  let prisma: PrismaService;
  let testUserId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, PrismaService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);

    const user = await prisma.user.upsert({
      where: { email: 'concurrency-tester@minierp.com' },
      update: {},
      create: {
        name: 'Concurrency Tester',
        email: 'concurrency-tester@minierp.com',
        passwordHash: 'dummy',
        role: Role.Warehouse,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('MUST prevent negative stock under concurrent stock-OUT requests (Concurrency Test)', async () => {
    const sku = `CONC-SKU-${Date.now()}`;
    const product = await prisma.product.create({
      data: {
        name: 'Concurrent Test Item',
        sku,
        category: 'Test',
        unitPrice: 100,
        currentStock: 5,
        minStockAlert: 2,
        warehouseLocation: 'Bin T-1',
      },
    });

    const stockOutDto = {
      quantityChanged: 4,
      movementType: MovementType.OUT,
      reason: 'Concurrent Test OUT',
    };

    // Fire 2 simultaneous stock-OUT requests for quantity=4 each against stock=5
    const results = await Promise.allSettled([
      service.recordStockMovement(product.id, stockOutDto as any, testUserId),
      service.recordStockMovement(product.id, stockOutDto as any, testUserId),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one must succeed and one must fail
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // The rejected request must be a BadRequestException with insufficient stock error
    const rejectedReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectedReason).toBeInstanceOf(BadRequestException);
    expect(rejectedReason.message).toContain('Insufficient stock');

    // Final database stock must be 1 (5 - 4 = 1), NEVER negative
    const finalProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(finalProduct?.currentStock).toBe(1);

    // Clean up
    await prisma.stockMovement.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
  });
});
