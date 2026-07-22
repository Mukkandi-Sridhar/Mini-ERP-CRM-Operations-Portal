import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateFollowUpDto,
  PaginationQueryDto,
  buildPaginatedEnvelope,
} from '../../shared-types';
import { CustomerStatus, CustomerType, ChallanStatus } from '@prisma/client';

export interface CustomerQueryDto extends PaginationQueryDto {
  status?: CustomerStatus;
  type?: CustomerType;
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: CustomerQueryDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { mobile: { contains: query.search, mode: 'insensitive' } },
        { businessName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { challans: true, followUps: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return buildPaginatedEnvelope(data, total, page, pageSize);
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true } } },
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            challanNumber: true,
            status: true,
            totalQuantity: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async create(dto: CreateCustomerDto, userId: string) {
    if (!dto.name || !dto.mobile || !dto.businessName || !dto.address) {
      throw new BadRequestException('Required fields missing');
    }

    const followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : null;

    return this.prisma.customer.create({
      data: {
        name: dto.name,
        mobile: dto.mobile,
        email: dto.email,
        businessName: dto.businessName,
        gstNumber: dto.gstNumber || null,
        type: dto.type,
        address: dto.address,
        status: dto.status || CustomerStatus.Lead,
        followUpDate,
        notes: dto.notes || null,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);

    const updateData: any = { ...dto };
    if (dto.followUpDate !== undefined) {
      updateData.followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : null;
    }

    return this.prisma.customer.update({
      where: { id },
      data: updateData,
    });
  }

  async softDelete(id: string) {
    const customer = await this.findOne(id);

    // Business Rule check: 409 if customer has non-cancelled challans
    const activeChallans = await this.prisma.challan.count({
      where: {
        customerId: id,
        status: { in: [ChallanStatus.Draft, ChallanStatus.Confirmed] },
      },
    });

    if (activeChallans > 0) {
      throw new ConflictException(
        `Cannot delete customer '${customer.name}'. Customer has ${activeChallans} active (Draft or Confirmed) challan(s). Please cancel or fulfill them first.`
      );
    }

    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addFollowUp(customerId: string, dto: CreateFollowUpDto, userId: string) {
    const customer = await this.findOne(customerId);

    const followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : customer.followUpDate;

    const followUp = await this.prisma.followUp.create({
      data: {
        customerId,
        note: dto.note,
        followUpDate,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (dto.followUpDate !== undefined) {
      await this.prisma.customer.update({
        where: { id: customerId },
        data: { followUpDate },
      });
    }

    return followUp;
  }

  async getFollowUps(customerId: string, query: PaginationQueryDto) {
    await this.findOne(customerId);

    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.followUp.findMany({
        where: { customerId },
        skip,
        take: pageSize,
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.followUp.count({ where: { customerId } }),
    ]);

    return buildPaginatedEnvelope(data, total, page, pageSize);
  }
}
