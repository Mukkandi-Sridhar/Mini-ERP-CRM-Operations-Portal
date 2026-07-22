import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService, ProductQueryDto } from './products.service';
import { CreateProductDto, UpdateProductDto, StockMovementDto, PaginationQueryDto } from '@mini-erp/shared-types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role, User } from '@prisma/client';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @Roles(Role.Admin, Role.Sales, Role.Warehouse, Role.Accounts)
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Sales, Role.Warehouse, Role.Accounts)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Warehouse)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Warehouse)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  softDelete(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }

  @Post(':id/stock-movements')
  @Roles(Role.Admin, Role.Warehouse)
  recordStockMovement(
    @Param('id') id: string,
    @Body() dto: StockMovementDto,
    @GetUser() user: User,
  ) {
    return this.productsService.recordStockMovement(id, dto, user.id);
  }

  @Get(':id/stock-movements')
  @Roles(Role.Admin, Role.Sales, Role.Warehouse, Role.Accounts)
  getStockMovements(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.productsService.getStockMovements(id, query);
  }
}
