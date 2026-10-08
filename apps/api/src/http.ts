import {
  ArgumentsHost,
  BadRequestException,
  CanActivate,
  Catch,
  ExceptionFilter,
  ExecutionContext,
  HttpException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { Prisma } from './generated/prisma/client';
import type { Request, Response } from 'express';
import { z } from 'zod';
export interface AuthRequest extends Request {
  auth: { userId: string; sessionId: string; csrfHash: string; transport: 'cookie' | 'bearer' };
  requestId: string;
}
@Injectable()
export class RequestShapeGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const path = req.path.replace(/\/$/, '');
    const list = req.method === 'GET' && ['/api/projects', '/api/tasks'].includes(path);
    if (!list) new SchemaPipe(z.strictObject({})).transform(req.query);
    if (['GET', 'DELETE'].includes(req.method) || path === '/api/auth/logout')
      new SchemaPipe(z.strictObject({})).transform(req.body ?? {});
    const platform = req.header('x-client-platform');
    if (platform && !['web', 'mobile'].includes(platform))
      throw new BadRequestException('Invalid client platform.');
    return true;
  }
}
@Injectable()
export class SchemaPipe implements PipeTransform {
  constructor(private readonly schema: z.ZodType) {}
  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues)
        (fieldErrors[issue.path.join('.') || 'form'] ??= []).push(issue.message);
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Please check the submitted fields.',
        fieldErrors,
      });
    }
    return result.data;
  }
}
@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<AuthRequest>();
    const res = ctx.getResponse<Response>();
    let status = 500;
    let body: Record<string, unknown> = {
      code: 'SERVER_ERROR',
      message: 'Something went wrong. Please try again.',
    };
    if (error instanceof HttpException) {
      status = error.getStatus();
      const response = error.getResponse();
      body =
        typeof response === 'string'
          ? { message: response }
          : (response as Record<string, unknown>);
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      [400, 413].includes(Number(error.status))
    ) {
      status = Number(error.status);
      body = {
        message: status === 413 ? 'Request body exceeds 32 KB.' : 'Malformed request body.',
      };
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        status = 409;
        body = { code: 'EMAIL_EXISTS', message: 'An account already uses this email.' };
      }
      if (['P2025', 'P2003'].includes(error.code)) {
        status = 404;
        body = { code: 'NOT_FOUND', message: 'This item is unavailable.' };
      }
    }
    // Log only error class, never query arguments, bodies, headers, or tokens.
    if (status >= 500)
      console.error(
        JSON.stringify({
          level: 'error',
          requestId: req.requestId,
          type: error instanceof Error ? error.name : 'UnknownError',
        }),
      );
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'SESSION_EXPIRED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      413: 'BODY_TOO_LARGE',
      429: 'RATE_LIMITED',
    };
    res.status(status).json({
      code: body.code ?? codes[status] ?? 'SERVER_ERROR',
      message: body.message,
      fieldErrors: body.fieldErrors,
      requestId: req.requestId,
    });
  }
}
