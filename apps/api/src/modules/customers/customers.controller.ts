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
import { CreateCustomerDto, UpdateCustomerDto, CreateFollowUpDto, PaginationQueryDto } from '../../shared-types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @Roles('Admin', 'Sales', 'Accounts')
  findAll(@Query() query: CustomerQueryDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Roles('Admin', 'Sales', 'Accounts')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @Roles('Admin', 'Sales')
  create(@Body() dto: CreateCustomerDto, @GetUser() user: any) {
    return this.customersService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('Admin', 'Sales')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Admin')
  softDelete(@Param('id') id: string) {
    return this.customersService.softDelete(id);
  }

  @Post(':id/follow-ups')
  @Roles('Admin', 'Sales')
  addFollowUp(
    @Param('id') id: string,
    @Body() dto: CreateFollowUpDto,
    @GetUser() user: any,
  ) {
    return this.customersService.addFollowUp(id, dto, user.id);
  }

  @Get(':id/follow-ups')
  @Roles('Admin', 'Sales', 'Accounts')
  getFollowUps(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.customersService.getFollowUps(id, query);
  }
}
