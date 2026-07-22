import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChallansService, ChallanQueryDto } from './challans.service';
import { CreateChallanDto, UpdateChallanDto } from '@mini-erp/shared-types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role, User } from '@prisma/client';

@Controller('challans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChallansController {
  constructor(private challansService: ChallansService) {}

  @Get()
  @Roles(Role.Admin, Role.Sales, Role.Accounts, Role.Warehouse)
  findAll(@Query() query: ChallanQueryDto, @GetUser() user: User) {
    return this.challansService.findAll(query, { id: user.id, role: user.role });
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Sales, Role.Accounts, Role.Warehouse)
  findOne(@Param('id') id: string) {
    return this.challansService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Sales)
  create(@Body() dto: CreateChallanDto, @GetUser() user: User) {
    return this.challansService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Sales)
  update(@Param('id') id: string, @Body() dto: UpdateChallanDto) {
    return this.challansService.update(id, dto);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.Admin, Role.Sales)
  confirm(@Param('id') id: string, @GetUser() user: User) {
    return this.challansService.confirm(id, user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.Admin, Role.Sales)
  cancel(@Param('id') id: string, @GetUser() user: User) {
    return this.challansService.cancel(id, user.id);
  }
}
