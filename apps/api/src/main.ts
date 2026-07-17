import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>("FRONTEND_URL") ?? "http://localhost:3000",
  });

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`Ihiga Lite API listening on 0.0.0.0:${port}`);
}

bootstrap();
