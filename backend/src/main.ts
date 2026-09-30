import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LocalAssetUrlInterceptor } from './common/interceptors/local-asset-url.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    allowedHeaders: ['Authorization', 'Content-Type', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
    origin: createCorsOriginValidator(),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LocalAssetUrlInterceptor());

  if (isSwaggerEnabled()) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Trimly API')
      .setDescription('Trimly mobil uygulamasının backend API dokümantasyonu.')
      .setVersion('0.1')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api/docs', app, swaggerDocument);
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
void bootstrap();

function createCorsOriginValidator() {
  const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || isDevelopment || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  };
}

function isSwaggerEnabled() {
  if (process.env.SWAGGER_ENABLED === 'true') return true;
  if (process.env.SWAGGER_ENABLED === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}
