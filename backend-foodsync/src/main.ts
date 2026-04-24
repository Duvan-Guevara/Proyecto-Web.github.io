import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // 👈 permite cualquier origen (para desarrollo)
  });

  await app.listen(3000, '0.0.0.0');
}
bootstrap();