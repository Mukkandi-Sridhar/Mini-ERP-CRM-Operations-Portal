import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@GetUser() user: any) {
    return this.dashboardService.getSummary({ id: user.id, role: user.role });
  }

  @Get('sales-trend')
  getSalesTrend(@Query('range') range: '7d' | '30d' | '90d') {
    return this.dashboardService.getSalesTrend(range);
  }
}
