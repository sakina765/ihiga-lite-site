import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Farmer } from "../farmers/entities/farmer.entity";
import { Conversation } from "../chat/entities/conversation.entity";
import { CropsModule } from "../crops/crops.module";
import { WeatherModule } from "../weather/weather.module";
import { SmsService } from "./sms.service";
import { NotificationSchedulerService } from "./notification-scheduler.service";

@Module({
  imports: [TypeOrmModule.forFeature([Farmer, Conversation]), CropsModule, WeatherModule],
  providers: [SmsService, NotificationSchedulerService],
  exports: [SmsService, NotificationSchedulerService],
})
export class NotificationsModule {}
