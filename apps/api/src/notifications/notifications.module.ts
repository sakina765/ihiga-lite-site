import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Farmer } from "../farmers/entities/farmer.entity";
import { Conversation } from "../chat/entities/conversation.entity";
import { NotificationLog } from "./entities/notification-log.entity";
import { CropsModule } from "../crops/crops.module";
import { WeatherModule } from "../weather/weather.module";
import { SmsService } from "./sms.service";
import { NotificationSchedulerService } from "./notification-scheduler.service";
import { AdminAlertsController } from "./admin-alerts.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Farmer, Conversation, NotificationLog]), CropsModule, WeatherModule, AuthModule],
  providers: [SmsService, NotificationSchedulerService],
  controllers: [AdminAlertsController],
  exports: [SmsService, NotificationSchedulerService],
})
export class NotificationsModule {}
