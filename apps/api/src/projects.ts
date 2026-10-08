import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Injectable,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  idSchema,
  projectQuerySchema,
  projectSchema,
  type ProjectInput,
  type ProjectQuery,
} from '@still/contracts';
import { Database } from './database';
import { AuthRequest, SchemaPipe } from './http';
import { projectData, projectDto, projectStatusDb } from './dto';
const include = {
  _count: { select: { tasks: true } },
  tasks: { where: { status: 'COMPLETED' as const }, select: { id: true } },
};
@Injectable()
export class ProjectsService {
  constructor(@Inject(Database) private readonly db: Database) {}
  async list(ownerId: string, q: ProjectQuery) {
    const where = {
      ownerId,
      ...(q.search ? { name: { contains: q.search, mode: 'insensitive' as const } } : {}),
      ...(q.status ? { status: projectStatusDb[q.status] } : {}),
    };
    const [items, total] = await this.db.$transaction([
      this.db.project.findMany({
        where,
        include,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.db.project.count({ where }),
    ]);
    return { items: items.map(projectDto), total, page: q.page, pageSize: q.pageSize };
  }
  async get(ownerId: string, id: string) {
    const item = await this.db.project.findFirst({ where: { ownerId, id }, include });
    if (!item) throw new NotFoundException('Project unavailable.');
    return projectDto(item);
  }
  async create(ownerId: string, input: ProjectInput) {
    return projectDto(
      await this.db.project.create({ data: { ownerId, ...projectData(input) }, include }),
    );
  }
  async update(ownerId: string, id: string, input: ProjectInput) {
    return projectDto(
      await this.db.project.update({ where: { id, ownerId }, data: projectData(input), include }),
    );
  }
  async remove(ownerId: string, id: string) {
    const result = await this.db.project.deleteMany({ where: { id, ownerId } });
    if (!result.count) throw new NotFoundException('Project unavailable.');
  }
}
@ApiTags('Projects')
@ApiCookieAuth('session')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly service: ProjectsService) {}
  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['Not Started', 'In Progress', 'Completed'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  list(@Req() req: AuthRequest, @Query(new SchemaPipe(projectQuerySchema)) q: ProjectQuery) {
    return this.service.list(req.auth.userId, q);
  }
  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  get(@Req() req: AuthRequest, @Param('id', new SchemaPipe(idSchema)) id: string) {
    return this.service.get(req.auth.userId, id);
  }
  @Post()
  @ApiBody({ schema: { $ref: '#/components/schemas/ProjectInput' } })
  create(@Req() req: AuthRequest, @Body(new SchemaPipe(projectSchema)) input: ProjectInput) {
    return this.service.create(req.auth.userId, input);
  }
  @Put(':id')
  @ApiBody({ schema: { $ref: '#/components/schemas/ProjectInput' } })
  update(
    @Req() req: AuthRequest,
    @Param('id', new SchemaPipe(idSchema)) id: string,
    @Body(new SchemaPipe(projectSchema)) input: ProjectInput,
  ) {
    return this.service.update(req.auth.userId, id, input);
  }
  @Delete(':id')
  @HttpCode(204)
  remove(@Req() req: AuthRequest, @Param('id', new SchemaPipe(idSchema)) id: string) {
    return this.service.remove(req.auth.userId, id);
  }
}
