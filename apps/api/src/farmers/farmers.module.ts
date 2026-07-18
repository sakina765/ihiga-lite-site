import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Farmer } from "./entities/farmer.entity";
import { FarmersService } from "./farmers.service";
import { FarmersController } from "./farmers.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Farmer])],
  providers: [FarmersService],
  controllers: [FarmersController],
  exports: [FarmersService],
})
export class FarmersModule {}
