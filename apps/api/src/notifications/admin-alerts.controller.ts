import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminAlertLogItem, NotificationSchedulerService } from "./notification-scheduler.service";
import { AdminAlertsQueryDto } from "./dto/admin-alerts-query.dto";
import { AdminGuard } from "../auth/admin.guard";

export interface AdminAlertsListResponse {
  items: AdminAlertLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

@Controller("admin/alerts")
@UseGuards(AdminGuard)
export class AdminAlertsController {
  constructor(private readonly notificationSchedulerService: NotificationSchedulerService) {}

  @Get()
  async list(@Query() query: AdminAlertsQueryDto): Promise<AdminAlertsListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { items, total } = await this.notificationSchedulerService.adminListAlerts({ page, pageSize });
    return { items, total, page, pageSize };
  }
}
