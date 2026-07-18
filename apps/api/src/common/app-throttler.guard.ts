import { ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerLimitDetail } from "@nestjs/throttler";
import { maskIpAddress } from "./pii.util";

const THROTTLED_MESSAGE = "You're sending requests a bit too quickly. Please wait a moment and try again.";

/**
 * Overrides the default ThrottlerGuard purely to (a) log when a limit
 * actually fires — so limits can be tuned from real traffic instead of
 * guessing — and (b) return a plain, farmer-facing message instead of
 * Throttler's default "ThrottlerException: Too Many Requests" wording.
 * Counting/tracking logic is entirely inherited from ThrottlerGuard.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  private readonly throttleLogger = new Logger(AppThrottlerGuard.name);

  protected async throwThrottlingException(context: ExecutionContext, throttlerLimitDetail: ThrottlerLimitDetail): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const maskedIp = maskIpAddress(request.ip ?? "unknown");
    this.throttleLogger.warn(
      `rate limit exceeded — method=${request.method} path=${request.url} ip=${maskedIp} ` +
        `limit=${throttlerLimitDetail.limit} ttlMs=${throttlerLimitDetail.ttl}`,
    );

    throw new HttpException({ statusCode: HttpStatus.TOO_MANY_REQUESTS, message: THROTTLED_MESSAGE }, HttpStatus.TOO_MANY_REQUESTS);
  }
}
