import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ADMIN_COOKIE_NAME } from "./admin-auth.constants";
import { AdminJwtPayload } from "./admin-jwt-payload.type";

/**
 * Every admin-only controller in this codebase must apply this guard
 * explicitly via @UseGuards(AdminGuard) — it is NOT registered globally
 * (unlike AppThrottlerGuard), so a regular farmer-facing route is never
 * accidentally admin-gated, and an admin route can never be reached without
 * the guard being present on it. Missing token, malformed/expired token, and
 * a valid token for a non-admin farmer all collapse to the same 403 — there's
 * no companion credential check needed here (the guard IS the credential
 * check), so unlike the anti-enumeration 200s elsewhere in this codebase, a
 * distinguishable 403 here is fine: this is an internal-only surface, not one
 * a farmer would ever legitimately probe.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.[ADMIN_COOKIE_NAME];
    if (!token) {
      throw new ForbiddenException("Admin access required");
    }

    let payload: AdminJwtPayload;
    try {
      payload = this.jwtService.verify<AdminJwtPayload>(token);
    } catch {
      throw new ForbiddenException("Admin access required");
    }

    if (payload.role !== "admin") {
      throw new ForbiddenException("Admin access required");
    }

    request.admin = payload;
    return true;
  }
}
