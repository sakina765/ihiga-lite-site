import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { AdminGuard } from "./admin.guard";
import { ADMIN_COOKIE_NAME, ADMIN_TOKEN_TTL_SECONDS } from "./admin-auth.constants";
import { AdminJwtPayload } from "./admin-jwt-payload.type";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  // Tight — this is a credential-guessing target same as farmer registration,
  // and legitimate use is at most a handful of attempts by a real admin.
  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() body: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    const admin = await this.authService.validateAdminCredentials(body.phoneNumber, body.password);
    if (!admin) {
      throw new UnauthorizedException("Invalid phone number or password");
    }

    const token = this.authService.issueAdminToken(admin);
    this.setAdminCookie(res, token);

    return { adminId: admin.id, phoneNumber: admin.phoneNumber };
  }

  @Post("logout")
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(ADMIN_COOKIE_NAME, { path: "/" });
  }

  // Lets the admin frontend check "am I actually logged in as an admin" on
  // load, without re-sending credentials — same purpose as the farmer side's
  // GET /farmers/:id/language existence check, just gated by AdminGuard
  // instead of being a public anti-enumeration-safe lookup.
  @Get("me")
  @UseGuards(AdminGuard)
  me(@Req() req: Request & { admin: AdminJwtPayload }) {
    return { adminId: req.admin.sub };
  }

  private setAdminCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      // "none" is required for the cookie to be sent on cross-site requests
      // once the deployed frontend (vercel.app) and API (onrender.com) are on
      // genuinely different sites — but "none" without "secure" is rejected
      // by browsers outright, so this only ever applies in production (HTTPS).
      // Locally, apps/web and apps/api are different ports on "localhost",
      // which browsers treat as the SAME site regardless of port — "lax" is
      // both sufficient and correct there.
      sameSite: isProduction ? "none" : "lax",
      maxAge: ADMIN_TOKEN_TTL_SECONDS * 1000,
      path: "/",
    });
  }
}
