import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  StockMovementDto,
  PaginationQueryDto,
  buildPaginatedEnvelope,
} from '@mini-erp/shared-types';
import { MovementType, ReferenceType, ChallanStatus } from '@prisma/client';

export interface ProductQueryDto extends PaginationQueryDto {
  category?: string;
  lowStockOnly?: boolean | string;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deletedAt: null,
    };

    if (query.category) {
      where.category = query.category;
    }

    const isLowStock = String(query.lowStockOnly) === 'true';

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
        { warehouseLocation: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Handle lowStockOnly accurately in Prisma raw or conditional filter
    let data;
    let total;

    if (isLowStock) {
      const allMatching = await this.prisma.product.findMany({
        where: {
          deletedAt: null,
          ...(query.category ? { category: query.category } : {}),
          ...(query.search
            ? {
                OR: [
                  { name: { contains: query.search, mode: 'insensitive' } },
                  { sku: { contains: query.search, mode: 'insensitive' } },
                  { category: { contains: query.search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: { currentStock: 'asc' },
      });
      const filtered = allMatching.filter((p) => p.currentStock <= p.minStockAlert);
      total = filtered.length;
      data = filtered.slice(skip, skip + pageSize);
    } else {
      [data, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.product.count({ where }),
      ]);
    }

    return buildPaginatedEnvelope(data, total, page, pageSize);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        stockMovements: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true } } },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku.toUpperCase() },
    });

    if (existingSku) {
      throw new ConflictException(`Product with SKU '${dto.sku.toUpperCase()}' already exists`);
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        sku: dto.sku.toUpperCase(),
        category: dto.category,
        unitPrice: dto.unitPrice,
        currentStock: dto.currentStock ?? 0,
        minStockAlert: dto.minStockAlert ?? 10,
        warehouseLocation: dto.warehouseLocation,
        imageUrl: dto.imageUrl || null,
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    // Enforce rule: currentStock cannot be edited directly via product update
    const { currentStock, sku, ...allowedFields } = dto as any;

    if (sku) {
      const existing = await this.prisma.product.findFirst({
        where: { sku: sku.toUpperCase(), id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`SKU '${sku.toUpperCase()}' is taken by another product`);
      }
      allowedFields.sku = sku.toUpperCase();
    }

    return this.prisma.product.update({
      where: { id },
      data: allowedFields,
    });
  }

  async softDelete(id: string) {
    const product = await this.findOne(id);

    // 409 if referenced by Draft challans
    const draftChallansCount = await this.prisma.challanItem.count({
      where: {
        productId: id,
        challan: { status: ChallanStatus.Draft },
      },
    });

    if (draftChallansCount > 0) {
      throw new ConflictException(
        `Cannot delete product '${product.name}' (${product.sku}). It is currently referenced in ${draftChallansCount} Draft challan(s).`
      );
    }

    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * CRITICAL TRANSACTIONAL METHOD WITH ROW-LEVEL LOCKING
   * Adjusts stock via append-only StockMovement ledger.
   * Guarantees non-negative stock even under concurrent requests.
   */
  async recordStockMovement(productId: string, dto: StockMovementDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Execute raw row lock: SELECT ... FOR UPDATE
      const productsLocked: Array<{ id: string; currentStock: number; name: string; sku: string }> =
        await tx.$queryRaw`SELECT id, "currentStock", name, sku FROM "Product" WHERE id = ${productId} AND "deletedAt" IS NULL FOR UPDATE`;

      if (!productsLocked || productsLocked.length === 0) {
        throw new NotFoundException('Product not found or has been deleted');
      }

      const product = productsLocked[0];
      const quantity = Math.abs(dto.quantityChanged);

      let newStock = product.currentStock;
      if (dto.movementType === MovementType.OUT) {
        if (product.currentStock < quantity) {
          throw new BadRequestException(
            `Insufficient stock for SKU ${product.sku} (${product.name}). Available: ${product.currentStock}, Requested OUT: ${quantity}`
          );
        }
        newStock -= quantity;
      } else {
        newStock += quantity;
      }

      // Update product current stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      // Insert append-only stock movement entry
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantityChanged: quantity,
          movementType: dto.movementType,
          reason: dto.reason,
          referenceType: ReferenceType.MANUAL,
          createdById: userId,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      });

      return {
        product: updatedProduct,
        movement,
      };
    });
  }

  async getStockMovements(productId: string, query: PaginationQueryDto) {
    await this.findOne(productId);

    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where: { productId },
        skip,
        take: pageSize,
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({ where: { productId } }),
    ]);

    return buildPaginatedEnvelope(data, total, page, pageSize);
  }
}
