import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Farmer } from "../farmers/entities/farmer.entity";
import { AuthService } from "./auth.service";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminGuard } from "./admin.guard";
import { ADMIN_TOKEN_TTL_SECONDS } from "./admin-auth.constants";

@Module({
  imports: [
    TypeOrmModule.forFeature([Farmer]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>("ADMIN_JWT_SECRET");
        if (!secret) {
          // Fail at boot, not on the first login attempt — an unset secret
          // would otherwise mean JwtModule silently signs tokens with
          // `undefined`, which is either an outright crash or (depending on
          // the jsonwebtoken version's behavior) a much worse silent problem.
          throw new Error("ADMIN_JWT_SECRET must be set — required to sign/verify admin session tokens.");
        }
        return { secret, signOptions: { expiresIn: ADMIN_TOKEN_TTL_SECONDS } };
      },
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AuthService, AdminGuard],
  // AdminGuard + JwtModule are exported so every other admin-only controller
  // added in later phases (KnowledgeModule, CropsModule, etc.) can import
  // AuthModule and apply @UseGuards(AdminGuard) without redeclaring JWT setup.
  exports: [AdminGuard, JwtModule],
})
export class AuthModule {}
