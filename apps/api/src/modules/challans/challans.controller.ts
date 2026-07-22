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

@Controller('challans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChallansController {
  constructor(private challansService: ChallansService) {}

  @Get()
  @Roles('Admin', 'Sales', 'Accounts', 'Warehouse')
  findAll(@Query() query: ChallanQueryDto, @GetUser() user: any) {
    return this.challansService.findAll(query, { id: user.id, role: user.role });
  }

  @Get(':id')
  @Roles('Admin', 'Sales', 'Accounts', 'Warehouse')
  findOne(@Param('id') id: string) {
    return this.challansService.findOne(id);
  }

  @Post()
  @Roles('Admin', 'Sales')
  create(@Body() dto: CreateChallanDto, @GetUser() user: any) {
    return this.challansService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('Admin', 'Sales')
  update(@Param('id') id: string, @Body() dto: UpdateChallanDto) {
    return this.challansService.update(id, dto);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @Roles('Admin', 'Sales')
  confirm(@Param('id') id: string, @GetUser() user: any) {
    return this.challansService.confirm(id, user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('Admin', 'Sales')
  cancel(@Param('id') id: string, @GetUser() user: any) {
    return this.challansService.cancel(id, user.id);
  }
}
