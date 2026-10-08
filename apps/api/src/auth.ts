import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  HttpCode,
  Inject,
  Injectable,
  Post,
  Req,
  Res,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ApiBody, ApiCookieAuth, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { compare, hash } from 'bcryptjs';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Response } from 'express';
import {
  idSchema,
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from '@still/contracts';
import { Database } from './database';
import { config, deployed } from './config';
import { AuthRequest, SchemaPipe } from './http';
export const Public = () => SetMetadata('public', true);
export const cookieName = deployed ? '__Host-still' : 'still-session';
const userSelect = { id: true, fullName: true, email: true, createdAt: true } as const;
const csrf = (id: string) =>
  createHmac('sha256', config.JWT_SECRET)
    .update('csrf:' + id)
    .digest('hex');
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
@Injectable()
export class AuthService {
  constructor(
    @Inject(Database) private readonly db: Database,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}
  async register(input: RegisterInput) {
    return this.db.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        passwordHash: await hash(input.password, 12),
      },
      select: userSelect,
    });
  }
  async login(input: LoginInput) {
    const user = await this.db.user.findUnique({ where: { email: input.email } });
    // A real bcrypt comparison is performed for nonexistent accounts as well.
    const valid = await compare(
      input.password,
      user?.passwordHash ?? '$2b$12$C6UzMDM.H6dfI/f/IKcEe.0jjjxlRLZIwLcNd.GFJiGSH.Kqx4iKi',
    );
    if (!user || !valid)
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect.',
      });
    return { id: user.id, fullName: user.fullName, email: user.email, createdAt: user.createdAt };
  }
  async issue(user: Awaited<ReturnType<AuthService['register']>>, req: AuthRequest, res: Response) {
    const mobile = req.header('x-client-platform') === 'mobile';
    if (!mobile && !config.WEB_ORIGINS.includes(req.header('origin') ?? ''))
      throw new ForbiddenException('A trusted web origin is required.');
    const expiresAt = new Date(Date.now() + config.SESSION_HOURS * 3600000);
    const session = await this.db.authSession.create({
      data: { userId: user.id, expiresAt, csrfHash: '' },
    });
    const csrfToken = csrf(session.id);
    await this.db.authSession.update({
      where: { id: session.id },
      data: { csrfHash: digest(csrfToken) },
    });
    const token = await this.jwt.signAsync(
      { sub: user.id, sid: session.id },
      {
        expiresIn: config.SESSION_HOURS * 3600,
        issuer: 'still-api',
        audience: 'still-clients',
        algorithm: 'HS256',
      },
    );
    if (mobile) return { user, expiresAt: expiresAt.toISOString(), token };
    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: deployed,
      sameSite: config.COOKIE_SAME_SITE,
      path: '/',
      maxAge: config.SESSION_HOURS * 3600000,
    });
    return { user, expiresAt: expiresAt.toISOString(), csrfToken };
  }
  async me(req: AuthRequest) {
    const [user, session] = await Promise.all([
      this.db.user.findUniqueOrThrow({ where: { id: req.auth.userId }, select: userSelect }),
      this.db.authSession.findUniqueOrThrow({ where: { id: req.auth.sessionId } }),
    ]);
    return {
      user,
      expiresAt: session.expiresAt.toISOString(),
      ...(req.auth.transport === 'cookie' ? { csrfToken: csrf(session.id) } : {}),
    };
  }
  async logout(req: AuthRequest, res: Response) {
    await this.db.authSession.updateMany({
      where: { id: req.auth.sessionId, userId: req.auth.userId },
      data: { revokedAt: new Date() },
    });
    if (req.auth.transport === 'cookie')
      res.clearCookie(cookieName, {
        httpOnly: true,
        secure: deployed,
        sameSite: config.COOKIE_SAME_SITE,
        path: '/',
      });
  }
}
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(Database) private readonly db: Database,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    if (this.reflector.getAllAndOverride('public', [ctx.getHandler(), ctx.getClass()])) return true;
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    const header = req.header('authorization');
    const bearer = header?.match(/^Bearer (\S+)$/)?.[1];
    if (header && !bearer)
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    const token = bearer ?? req.cookies?.[cookieName];
    if (!token) throw new UnauthorizedException('Your session has expired. Please sign in again.');
    let payload: { sub: string; sid: string };
    try {
      payload = await this.jwt.verifyAsync(token, {
        algorithms: ['HS256'],
        issuer: 'still-api',
        audience: 'still-clients',
      });
    } catch {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }
    if (!idSchema.safeParse(payload.sub).success || !idSchema.safeParse(payload.sid).success)
      throw new UnauthorizedException();
    const session = await this.db.authSession.findFirst({
      where: {
        id: payload.sid,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!session)
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    req.auth = {
      userId: payload.sub,
      sessionId: payload.sid,
      csrfHash: session.csrfHash,
      transport: bearer ? 'bearer' : 'cookie',
    };
    if (!bearer && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const received = req.header('x-csrf-token') ?? '';
      if (
        !config.WEB_ORIGINS.includes(req.header('origin') ?? '') ||
        !timingSafeEqual(Buffer.from(digest(received)), Buffer.from(session.csrfHash))
      )
        throw new ForbiddenException({
          code: 'CSRF_REJECTED',
          message: 'Refresh your session and try again.',
        });
    }
    return true;
  }
}
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  @Public()
  @Post('register')
  @ApiBody({ schema: { $ref: '#/components/schemas/RegisterInput' } })
  async register(
    @Body(new SchemaPipe(registerSchema)) body: RegisterInput,
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.issue(await this.auth.register(body), req, res);
  }
  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiBody({ schema: { $ref: '#/components/schemas/LoginInput' } })
  async login(
    @Body(new SchemaPipe(loginSchema)) body: LoginInput,
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.issue(await this.auth.login(body), req, res);
  }
  @Get('me')
  @ApiCookieAuth('session')
  @ApiBearerAuth()
  me(@Req() req: AuthRequest) {
    return this.auth.me(req);
  }
  @Post('logout')
  @HttpCode(204)
  @ApiCookieAuth('session')
  @ApiBearerAuth()
  async logout(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req, res);
  }
}
