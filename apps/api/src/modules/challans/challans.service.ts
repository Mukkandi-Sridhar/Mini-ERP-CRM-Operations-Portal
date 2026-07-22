import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateChallanDto,
  UpdateChallanDto,
  PaginationQueryDto,
  buildPaginatedEnvelope,
} from '@mini-erp/shared-types';
import { ChallanStatus, MovementType, ReferenceType, Prisma } from '@prisma/client';

export interface ChallanQueryDto extends PaginationQueryDto {
  status?: ChallanStatus;
  customerId?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class ChallansService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ChallanQueryDto, user: { id: string; role: string }) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    if (query.search) {
      where.OR = [
        { challanNumber: { contains: query.search, mode: 'insensitive' } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
        { customer: { businessName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.challan.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          customer: { select: { id: true, name: true, businessName: true, mobile: true } },
          createdBy: { select: { id: true, name: true, role: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.challan.count({ where }),
    ]);

    return buildPaginatedEnvelope(data, total, page, pageSize);
  }

  async findOne(id: string) {
    const challan = await this.prisma.challan.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, businessName: true, email: true, mobile: true, address: true, gstNumber: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, currentStock: true } },
          },
        },
      },
    });

    if (!challan) {
      throw new NotFoundException('Challan not found');
    }

    return challan;
  }

  async create(dto: CreateChallanDto, userId: string) {
    // Validate customer exists and is not soft deleted
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, deletedAt: null },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Challan must contain at least one item');
    }

    // Fetch product details for snapshot calculations
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalQuantity = 0;
    let totalAmount = new Prisma.Decimal(0);

    const challanItemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Product ID '${item.productId}' not found`);
      }
      const unitPrice = product.unitPrice;
      const lineTotal = new Prisma.Decimal(unitPrice.toString()).mul(item.quantity);

      totalQuantity += item.quantity;
      totalAmount = totalAmount.add(lineTotal);

      return {
        productId: product.id,
        productNameSnapshot: product.name,
        skuSnapshot: product.sku,
        unitPriceSnapshot: unitPrice,
        quantity: item.quantity,
        lineTotal,
      };
    });

    return this.prisma.challan.create({
      data: {
        customerId: dto.customerId,
        status: ChallanStatus.Draft,
        totalQuantity,
        totalAmount,
        createdById: userId,
        items: {
          create: challanItemsData,
        },
      },
      include: {
        customer: { select: { id: true, name: true, businessName: true } },
        items: true,
      },
    });
  }

  async update(id: string, dto: UpdateChallanDto) {
    const existing = await this.findOne(id);

    if (existing.status !== ChallanStatus.Draft) {
      throw new ConflictException(
        `Challan ${existing.challanNumber || id} cannot be edited because its status is '${existing.status}'. Only Draft challans are editable.`
      );
    }

    if (dto.items && dto.items.length > 0) {
      const productIds = dto.items.map((i) => i.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let totalQuantity = 0;
      let totalAmount = new Prisma.Decimal(0);

      const newItems = dto.items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(`Product '${item.productId}' not found`);
        }
        const unitPrice = product.unitPrice;
        const lineTotal = new Prisma.Decimal(unitPrice.toString()).mul(item.quantity);

        totalQuantity += item.quantity;
        totalAmount = totalAmount.add(lineTotal);

        return {
          productId: product.id,
          productNameSnapshot: product.name,
          skuSnapshot: product.sku,
          unitPriceSnapshot: unitPrice,
          quantity: item.quantity,
          lineTotal,
        };
      });

      // Transactionally replace items
      return this.prisma.$transaction(async (tx) => {
        await tx.challanItem.deleteMany({ where: { challanId: id } });
        return tx.challan.update({
          where: { id },
          data: {
            customerId: dto.customerId || existing.customerId,
            totalQuantity,
            totalAmount,
            items: { create: newItems },
          },
          include: { customer: true, items: true },
        });
      });
    }

    return this.prisma.challan.update({
      where: { id },
      data: {
        customerId: dto.customerId || existing.customerId,
      },
      include: { customer: true, items: true },
    });
  }

  /**
   * CRITICAL TRANSACTIONAL ENDPOINT FOR CONFIRMING A CHALLAN
   * Business Rules:
   * 1. Check idempotency: if status !== Draft -> 409 Conflict.
   * 2. For every item, execute `SELECT ... FOR UPDATE` on product row to prevent race conditions.
   * 3. Check currentStock >= quantity. Throw 400 Bad Request if stock would go negative.
   * 4. Decrement product stock and create append-only OUT StockMovement record.
   * 5. Generate unique, gapless-looking Challan Number (CH-YYYYMM-00000X).
   * 6. Set status = Confirmed, confirmedAt = now.
   */
  async confirm(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock the Challan row itself with FOR UPDATE to guarantee status check atomicity under concurrency
      const lockedChallans: Array<{ id: string; status: ChallanStatus }> =
        await tx.$queryRaw`SELECT id, status FROM "Challan" WHERE id = ${id} FOR UPDATE`;

      if (!lockedChallans || lockedChallans.length === 0) {
        throw new NotFoundException('Challan not found');
      }

      if (lockedChallans[0].status !== ChallanStatus.Draft) {
        throw new ConflictException(
          `Challan is already in status '${lockedChallans[0].status}' and cannot be confirmed again.`
        );
      }

      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true, customer: true },
      });

      if (!challan || !challan.items || challan.items.length === 0) {
        throw new BadRequestException('Cannot confirm a challan with no line items.');
      }

      // 2. Deduct stock for each line item with ROW-LEVEL LOCKING
      for (const item of challan.items) {
        if (!item.productId) {
          throw new BadRequestException(`Line item '${item.productNameSnapshot}' is missing product reference.`);
        }

        const lockedProducts: Array<{ id: string; currentStock: number; name: string; sku: string }> =
          await tx.$queryRaw`SELECT id, "currentStock", name, sku FROM "Product" WHERE id = ${item.productId} AND "deletedAt" IS NULL FOR UPDATE`;

        if (!lockedProducts || lockedProducts.length === 0) {
          throw new NotFoundException(`Product '${item.productNameSnapshot}' (SKU: ${item.skuSnapshot}) not found or deleted.`);
        }

        const product = lockedProducts[0];

        if (product.currentStock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for SKU ${item.skuSnapshot} (${item.productNameSnapshot}). Available: ${product.currentStock}, Requested: ${item.quantity}`
          );
        }

        const newStock = product.currentStock - item.quantity;

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: newStock },
        });

        // Write append-only StockMovement record
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantityChanged: item.quantity,
            movementType: MovementType.OUT,
            reason: `Challan Confirmed: ${challan.id}`,
            referenceType: ReferenceType.CHALLAN,
            referenceId: challan.id,
            createdById: userId,
          },
        });
      }

      // 3. Generate gapless Challan Number using atomic ChallanSequence table locked FOR UPDATE
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

      const sequenceLock: Array<{ yearMonth: string; lastValue: number }> =
        await tx.$queryRaw`SELECT "yearMonth", "lastValue" FROM "ChallanSequence" WHERE "yearMonth" = ${yearMonth} FOR UPDATE`;

      let nextSeq = 1;
      if (!sequenceLock || sequenceLock.length === 0) {
        await tx.$executeRaw`INSERT INTO "ChallanSequence" ("yearMonth", "lastValue") VALUES (${yearMonth}, 1)`;
        nextSeq = 1;
      } else {
        nextSeq = sequenceLock[0].lastValue + 1;
        await tx.$executeRaw`UPDATE "ChallanSequence" SET "lastValue" = ${nextSeq} WHERE "yearMonth" = ${yearMonth}`;
      }

      const challanNumber = `CH-${yearMonth}-${String(nextSeq).padStart(6, '0')}`;

      // Update movement reasons with final challan number
      await tx.stockMovement.updateMany({
        where: { referenceId: challan.id },
        data: { reason: `Challan Confirmed: ${challanNumber}` },
      });

      // Mark challan confirmed
      const confirmedChallan = await tx.challan.update({
        where: { id },
        data: {
          challanNumber,
          status: ChallanStatus.Confirmed,
          confirmedAt: now,
        },
        include: {
          customer: true,
          items: true,
          createdBy: { select: { id: true, name: true } },
        },
      });

      return confirmedChallan;
    });
  }

  /**
   * CANCEL A CHALLAN
   * If Confirmed -> Restocks line items with offsetting IN StockMovements.
   * If Draft -> Simply sets status to Cancelled.
   */
  async cancel(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!challan) {
        throw new NotFoundException('Challan not found');
      }

      if (challan.status === ChallanStatus.Cancelled) {
        throw new ConflictException(`Challan ${challan.challanNumber || id} is already cancelled.`);
      }

      const now = new Date();

      if (challan.status === ChallanStatus.Confirmed) {
        // Restock every line item
        for (const item of challan.items) {
          if (item.productId) {
            const lockedProducts: Array<{ id: string; currentStock: number }> =
              await tx.$queryRaw`SELECT id, "currentStock" FROM "Product" WHERE id = ${item.productId} FOR UPDATE`;

            if (lockedProducts && lockedProducts.length > 0) {
              const product = lockedProducts[0];
              await tx.product.update({
                where: { id: item.productId },
                data: { currentStock: product.currentStock + item.quantity },
              });

              await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  quantityChanged: item.quantity,
                  movementType: MovementType.IN,
                  reason: `Restock offset on Challan Cancelled: ${challan.challanNumber || challan.id}`,
                  referenceType: ReferenceType.CHALLAN,
                  referenceId: challan.id,
                  createdById: userId,
                },
              });
            }
          }
        }
      }

      return tx.challan.update({
        where: { id },
        data: {
          status: ChallanStatus.Cancelled,
          cancelledAt: now,
        },
        include: { customer: true, items: true },
      });
    });
  }
}
