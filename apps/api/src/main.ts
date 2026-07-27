import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  // Only ever populates req.cookies with the admin session cookie
  // (ihiga_admin_token, set by AdminAuthController) — the farmer-facing app
  // sends no cookies at all (farmerId travels as a request body/query field,
  // unchanged by this addition), so this has no effect on any existing route.
  app.use(cookieParser());

  // Render sits as exactly one reverse proxy in front of this API — trusting
  // ONLY that one hop (not `true`, which would trust the entire chain) means
  // Express takes the client IP Render itself observed and appended to
  // X-Forwarded-For, while still ignoring any earlier, client-spoofable
  // entries a malicious caller could prepend to that same header. Without
  // this, req.ip resolves to Render's own proxy address for every request
  // (trust proxy defaults to off), collapsing the throttler's per-IP rate
  // limit into one shared bucket for the entire farmer population — see
  // AppThrottlerGuard, which keys on req.ip via the inherited ThrottlerGuard.
  app.set("trust proxy", 1);

  // Locked to the single configured frontend origin — never a wildcard — since
  // this API is called by one known web client, not a public third-party API.
  // credentials: true is required for the admin session cookie to travel on
  // cross-origin requests (the deployed frontend and API are on different
  // sites) — it does not loosen the origin allowlist above, and the
  // farmer-facing flow (which sends no cookies) is unaffected either way.
  app.enableCors({
    origin: configService.get<string>("FRONTEND_URL") ?? "http://localhost:3000",
    credentials: true,
  });

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`Ihiga Lite API listening on 0.0.0.0:${port}`);
}

bootstrap();
