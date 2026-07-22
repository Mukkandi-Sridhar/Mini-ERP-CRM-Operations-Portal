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
import { CustomersService, CustomerQueryDto } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, CreateFollowUpDto, PaginationQueryDto } from '@mini-erp/shared-types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role, User } from '@prisma/client';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @Roles(Role.Admin, Role.Sales, Role.Accounts)
  findAll(@Query() query: CustomerQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Sales, Role.Accounts)
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Sales)
  create(@Body() dto: CreateCustomerDto, @GetUser() user: User) {
    return this.customersService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Sales)
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  softDelete(@Param('id') id: string) {
    return this.customersService.softDelete(id);
  }

  @Post(':id/follow-ups')
  @Roles(Role.Admin, Role.Sales)
  addFollowUp(
    @Param('id') id: string,
    @Body() dto: CreateFollowUpDto,
    @GetUser() user: User,
  ) {
    return this.customersService.addFollowUp(id, dto, user.id);
  }

  @Get(':id/follow-ups')
  @Roles(Role.Admin, Role.Sales, Role.Accounts)
  getFollowUps(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.customersService.getFollowUps(id, query);
  }
}
