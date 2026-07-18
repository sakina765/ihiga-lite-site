import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";

const GENERIC_SERVER_ERROR_MESSAGE = "Something went wrong on our end. Please try again in a moment.";

/**
 * Catch-all for every exception reaching the HTTP layer. Client errors
 * (4xx — validation failures, "farmerId is required", rate limiting, etc.)
 * are expected, farmer/client-facing feedback and pass through unchanged.
 *
 * 5xx (or any raw, non-HttpException error — a bug, a DB failure, an
 * upstream Groq/SMS error that got rethrown) is where this filter actually
 * does something: it always logs the real message + stack server-side with a
 * generated errorId, and in production replaces the response body with a
 * generic message + that errorId — never the raw error text, which could
 * otherwise leak upstream-service detail (see chat.controller.ts's
 * BadGatewayException on transcription failure) or internal implementation
 * detail to the client. Outside production the real message still comes
 * through in the body (but never a stack trace) since that's useful for local
 * debugging.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (isHttpException && status < HttpStatus.INTERNAL_SERVER_ERROR) {
      response.status(status).json(exception.getResponse());
      return;
    }

    const errorId = randomUUID();
    const rawMessage = isHttpException ? this.extractMessage(exception.getResponse()) : ((exception as Error)?.message ?? "unknown error");
    const stack = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(`[${errorId}] ${request.method} ${request.url} -> ${status}: ${rawMessage}`, stack);

    const isProduction = process.env.NODE_ENV === "production";
    response.status(status).json({
      statusCode: status,
      message: isProduction ? GENERIC_SERVER_ERROR_MESSAGE : rawMessage,
      errorId,
    });
  }

  private extractMessage(res: unknown): string {
    if (typeof res === "string") {
      return res;
    }
    if (res && typeof res === "object" && "message" in res) {
      const message = (res as { message: unknown }).message;
      return Array.isArray(message) ? message.join("; ") : String(message);
    }
    return "unknown error";
  }
}
