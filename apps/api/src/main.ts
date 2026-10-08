import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  loginSchema,
  registerSchema,
  projectSchema,
  taskSchema,
  projectQuerySchema,
  taskQuerySchema,
} from '@still/contracts';
import { AppModule } from './app.module';
import { config } from './config';
import { ErrorFilter } from './http';
import { documentResponses } from './openapi';
import { cookieName } from './auth';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.set('trust proxy', config.TRUST_PROXY_HOPS || false);
  app.disable('x-powered-by');
  app.use((req: any, res: any, next: any) => {
    req.requestId = randomUUID();
    res.setHeader('x-request-id', req.requestId);
    res.setHeader('Cache-Control', 'no-store');
    const start = Date.now();
    res.on('finish', () =>
      console.log(
        JSON.stringify({
          level: 'info',
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Date.now() - start,
        }),
      ),
    );
    next();
  });
  app.use(helmet());
  app.enableCors({
    origin: config.WEB_ORIGINS,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Client-Platform'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });
  app.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    if (origin && !config.WEB_ORIGINS.includes(origin))
      return res.status(403).json({
        code: 'ORIGIN_REJECTED',
        message: 'Origin is not trusted.',
        requestId: req.requestId,
      });
    if (
      ['/api/auth/login', '/api/auth/register'].includes(req.path) &&
      req.method === 'POST' &&
      req.headers['x-client-platform'] !== 'mobile' &&
      !origin
    )
      return res.status(403).json({
        code: 'ORIGIN_REQUIRED',
        message: 'A trusted web origin is required.',
        requestId: req.requestId,
      });
    next();
  });
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req: any, res) =>
      res.status(429).json({
        code: 'RATE_LIMITED',
        message: 'Too many attempts. Try again in 15 minutes.',
        requestId: req.requestId,
      }),
  });
  app.use(['/api/auth/login', '/api/auth/register'], limiter);
  app.use(json({ limit: '32kb' }));
  app.use(urlencoded({ extended: false, limit: '32kb' }));
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new ErrorFilter());
  app.enableShutdownHooks();
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Still API')
      .setDescription(
        'One owner-scoped backend for web and Android. Cookie mutations require X-CSRF-Token. Mobile uses Bearer JWT.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth(cookieName, { type: 'apiKey', in: 'cookie' }, 'session')
      .build(),
  );
  document.components ??= {};
  document.components.schemas ??= {};
  for (const [name, schema] of Object.entries({
    LoginInput: loginSchema,
    RegisterInput: registerSchema,
    ProjectInput: projectSchema,
    TaskInput: taskSchema,
    ProjectQuery: projectQuerySchema,
    TaskQuery: taskQuerySchema,
  })) {
    const generated = z.toJSONSchema(schema, { unrepresentable: 'any', io: 'input' });
    delete generated.$schema;
    document.components.schemas[name] = generated as any;
  }
  documentResponses(document);
  SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/openapi.json' });
  await app.listen(config.PORT, '0.0.0.0');
}
bootstrap().catch((error) => {
  console.error(
    JSON.stringify({
      level: 'fatal',
      type: error.name,
      message: 'API startup failed. Check configuration and database.',
    }),
  );
  process.exit(1);
});
