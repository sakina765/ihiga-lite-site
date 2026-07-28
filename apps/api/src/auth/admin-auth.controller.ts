import { Body, Controller, Get, HttpCode, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { CookieOptions, Request, Response } from "express";
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
    // Must carry the same secure/sameSite attributes the cookie was set with.
    // A browser identifies a stored cookie by (name, domain, path) alone, but
    // Chrome (and others) will silently downgrade a Set-Cookie that omits
    // SameSite to Lax and drop `Secure` if unspecified — in production this
    // cookie was set with SameSite=None; Secure (required for the Vercel/
    // Render cross-site setup, see setAdminCookie below), so clearing it with
    // a bare `{ path: "/" }` sent a mismatched, weaker Set-Cookie that some
    // browsers reject outright, leaving the real session cookie in place —
    // the admin appears to "sign out" (redirected to /admin/login) but the
    // still-valid cookie immediately logs them back in.
    res.clearCookie(ADMIN_COOKIE_NAME, this.getAdminCookieOptions());
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
    res.cookie(ADMIN_COOKIE_NAME, token, {
      ...this.getAdminCookieOptions(),
      maxAge: ADMIN_TOKEN_TTL_SECONDS * 1000,
    });
  }

  // Shared by set and clear so the two can never drift apart again.
  private getAdminCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === "production";
    return {
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
      path: "/",
    };
  }
}
