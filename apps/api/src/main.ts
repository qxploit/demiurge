import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: true, credentials: true });
  // stream all game art from the backend (single origin, cached hard).
  // resolve the assets dir for both local dev (cwd=apps/api) and docker.
  const assetsDir =
    [join(process.cwd(), '..', '..', 'assets'), join(process.cwd(), 'assets'), join(__dirname, '..', '..', '..', 'assets')].find(
      (p) => existsSync(p),
    ) ?? join(process.cwd(), '..', '..', 'assets');
  app.useStaticAssets(assetsDir, {
    prefix: '/assets/',
    maxAge: '7d',
    immutable: true,
  });
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Demiurge API on http://localhost:${port}`);
}
bootstrap();
