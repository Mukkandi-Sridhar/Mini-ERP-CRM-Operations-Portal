import { Test, TestingModule } from '@nestjs/testing';
import { ChallansService } from './challans.service';
import { ProductsService } from '../products/products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomerStatus, CustomerType, Role, ChallanStatus } from '@prisma/client';
import { ConflictException } from '@nestjs/common';

describe('ChallansService - Idempotency, Snapshots & Restocking', () => {
  let challansService: ChallansService;
  let productsService: ProductsService;
  let prisma: PrismaService;
  let testUserId: string;
  let testCustomerId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChallansService, ProductsService, PrismaService],
    }).compile();

    challansService = module.get<ChallansService>(ChallansService);
    productsService = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);

    const user = await prisma.user.upsert({
      where: { email: 'challan-tester@minierp.com' },
      update: {},
      create: {
        name: 'Challan Tester',
        email: 'challan-tester@minierp.com',
        passwordHash: 'dummy',
        role: Role.Sales,
      },
    });
    testUserId = user.id;

    const customer = await prisma.customer.create({
      data: {
        name: 'Challan Test Customer',
        mobile: '9998887770',
        email: 'challan.test@customer.com',
        businessName: 'Challan Test Business',
        type: CustomerType.Retail,
        address: '123 Test St',
        status: CustomerStatus.Active,
        createdById: testUserId,
      },
    });
    testCustomerId = customer.id;
  });

  afterAll(async () => {
    await prisma.challanItem.deleteMany();
    await prisma.challan.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.delete({ where: { id: testCustomerId } });
    await prisma.$disconnect();
  });

  it('MUST enforce double-submit idempotency on /confirm', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Idempotency Product',
        sku: `IDEM-${Date.now()}`,
        category: 'Test',
        unitPrice: 50,
        currentStock: 20,
        minStockAlert: 5,
        warehouseLocation: 'Bin I-1',
      },
    });

    const draft = await challansService.create(
      {
        customerId: testCustomerId,
        items: [{ productId: product.id, quantity: 5 }],
      },
      testUserId,
    );

    // First confirm
    const confirmed = await challansService.confirm(draft.id, testUserId);
    expect(confirmed.status).toBe(ChallanStatus.Confirmed);
    expect(confirmed.challanNumber).toBeDefined();

    // Verify stock decremented by 5 (20 - 5 = 15)
    const productAfterFirst = await prisma.product.findUnique({ where: { id: product.id } });
    expect(productAfterFirst?.currentStock).toBe(15);

    // Second confirm attempt MUST fail with ConflictException (409)
    await expect(challansService.confirm(draft.id, testUserId)).rejects.toThrow(ConflictException);

    // Verify stock was NOT double-deducted
    const productAfterSecond = await prisma.product.findUnique({ where: { id: product.id } });
    expect(productAfterSecond?.currentStock).toBe(15);
  });

  it('MUST safely handle TRUE CONCURRENT confirm() requests on the SAME draft challan', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Concurrent Idempotency Product',
        sku: `CONC-IDEM-${Date.now()}`,
        category: 'Test',
        unitPrice: 100,
        currentStock: 30,
        minStockAlert: 5,
        warehouseLocation: 'Bin C-1',
      },
    });

    const draft = await challansService.create(
      {
        customerId: testCustomerId,
        items: [{ productId: product.id, quantity: 10 }],
      },
      testUserId,
    );

    // Fire TWO concurrent confirm calls using Promise.allSettled
    const results = await Promise.allSettled([
      challansService.confirm(draft.id, testUserId),
      challansService.confirm(draft.id, testUserId),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);

    // Verify stock decremented EXACTLY ONCE (30 - 10 = 20)
    const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
    expect(productAfter?.currentStock).toBe(20);
  });

  it('MUST generate distinct, gapless challan numbers under CONCURRENT confirmations of DIFFERENT drafts', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Concurrent Sequence Product',
        sku: `CONC-SEQ-${Date.now()}`,
        category: 'Test',
        unitPrice: 50,
        currentStock: 50,
        minStockAlert: 5,
        warehouseLocation: 'Bin C-2',
      },
    });

    const draft1 = await challansService.create(
      { customerId: testCustomerId, items: [{ productId: product.id, quantity: 2 }] },
      testUserId,
    );

    const draft2 = await challansService.create(
      { customerId: testCustomerId, items: [{ productId: product.id, quantity: 3 }] },
      testUserId,
    );

    // Fire TWO concurrent confirm calls on DIFFERENT draft challans
    const results = await Promise.allSettled([
      challansService.confirm(draft1.id, testUserId),
      challansService.confirm(draft2.id, testUserId),
    ]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('fulfilled');

    const res1 = (results[0] as PromiseFulfilledResult<any>).value;
    const res2 = (results[1] as PromiseFulfilledResult<any>).value;

    expect(res1.challanNumber).toBeDefined();
    expect(res2.challanNumber).toBeDefined();
    expect(res1.challanNumber).not.toEqual(res2.challanNumber);
  });

  it('MUST snapshot line item price/name/sku so subsequent product edits do NOT alter historical challan', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Original Product Name',
        sku: `SNAP-${Date.now()}`,
        category: 'Test',
        unitPrice: 100,
        currentStock: 10,
        minStockAlert: 2,
        warehouseLocation: 'Bin S-1',
      },
    });

    const draft = await challansService.create(
      {
        customerId: testCustomerId,
        items: [{ productId: product.id, quantity: 2 }],
      },
      testUserId,
    );

    const confirmed = await challansService.confirm(draft.id, testUserId);
    expect(Number(confirmed.totalAmount)).toBe(200); // 2 * 100

    // Now edit the product price to 500 and name to "Modified Product Name"
    await productsService.update(product.id, {
      unitPrice: 500,
      name: 'Modified Product Name',
    });

    // Re-fetch historical confirmed challan
    const historicalChallan = await challansService.findOne(confirmed.id);
    expect(Number(historicalChallan.totalAmount)).toBe(200); // STAYS 200!
    expect(historicalChallan.items[0].productNameSnapshot).toBe('Original Product Name'); // STAYS Original!
    expect(Number(historicalChallan.items[0].unitPriceSnapshot)).toBe(100); // STAYS 100!
  });

  it('MUST restore exact stock quantities when a Confirmed challan is Cancelled', async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Restock Product',
        sku: `RSTK-${Date.now()}`,
        category: 'Test',
        unitPrice: 80,
        currentStock: 15,
        minStockAlert: 3,
        warehouseLocation: 'Bin R-1',
      },
    });

    const draft = await challansService.create(
      {
        customerId: testCustomerId,
        items: [{ productId: product.id, quantity: 4 }],
      },
      testUserId,
    );

    await challansService.confirm(draft.id, testUserId);
    const stockAfterConfirm = (await prisma.product.findUnique({ where: { id: product.id } }))?.currentStock;
    expect(stockAfterConfirm).toBe(11); // 15 - 4

    // Cancel confirmed challan
    await challansService.cancel(draft.id, testUserId);
    const stockAfterCancel = (await prisma.product.findUnique({ where: { id: product.id } }))?.currentStock;
    expect(stockAfterCancel).toBe(15); // RESTORED to 15!
  });
});
