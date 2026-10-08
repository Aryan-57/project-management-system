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
import { ApiBearerAuth, ApiBody, ApiCookieAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  idSchema,
  taskQuerySchema,
  taskSchema,
  type TaskInput,
  type TaskQuery,
} from '@still/contracts';
import { Database } from './database';
import { AuthRequest, SchemaPipe } from './http';
import { priorityDb, taskData, taskDto, taskStatusDb } from './dto';
import { Prisma } from './generated/prisma/client';
const include = { project: { select: { name: true } } };
@Injectable()
export class TasksService {
  constructor(@Inject(Database) private readonly db: Database) {}
  async list(ownerId: string, q: TaskQuery) {
    if (
      q.projectId &&
      !(await this.db.project.findFirst({
        where: { id: q.projectId, ownerId },
        select: { id: true },
      }))
    )
      throw new NotFoundException('Project unavailable.');
    const where = {
      project: { ownerId },
      ...(q.projectId ? { projectId: q.projectId } : {}),
      ...(q.search ? { name: { contains: q.search, mode: 'insensitive' as const } } : {}),
      ...(q.status ? { status: taskStatusDb[q.status] } : {}),
      ...(q.priority ? { priority: priorityDb[q.priority] } : {}),
    };
    const [items, total] = await this.db.$transaction([
      this.db.task.findMany({
        where,
        include,
        orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      this.db.task.count({ where }),
    ]);
    return { items: items.map(taskDto), total, page: q.page, pageSize: q.pageSize };
  }
  async get(ownerId: string, id: string) {
    const item = await this.db.task.findFirst({ where: { id, project: { ownerId } }, include });
    if (!item) throw new NotFoundException('Task unavailable.');
    return taskDto(item);
  }
  async write(ownerId: string, input: TaskInput, id?: string) {
    // Serializable transaction closes destination-project check/write races, including deletion.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.db.$transaction(
          async (tx) => {
            const project = await tx.project.findFirst({
              where: { id: input.projectId, ownerId },
              select: { id: true },
            });
            if (!project) throw new NotFoundException('Project unavailable.');
            const data = taskData(input);
            const item = id
              ? await tx.task.update({ where: { id, project: { ownerId } }, data, include })
              : await tx.task.create({ data, include });
            return taskDto(item);
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 2
        )
          continue;
        throw error;
      }
    }
  }
  async remove(ownerId: string, id: string) {
    const result = await this.db.task.deleteMany({ where: { id, project: { ownerId } } });
    if (!result.count) throw new NotFoundException('Task unavailable.');
  }
}
@ApiTags('Tasks')
@ApiCookieAuth('session')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(@Inject(TasksService) private readonly service: TasksService) {}
  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['Pending', 'In Progress', 'Completed'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['Low', 'Medium', 'High'] })
  @ApiQuery({ name: 'projectId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  list(@Req() req: AuthRequest, @Query(new SchemaPipe(taskQuerySchema)) q: TaskQuery) {
    return this.service.list(req.auth.userId, q);
  }
  @Get(':id')
  get(@Req() req: AuthRequest, @Param('id', new SchemaPipe(idSchema)) id: string) {
    return this.service.get(req.auth.userId, id);
  }
  @Post()
  @ApiBody({ schema: { $ref: '#/components/schemas/TaskInput' } })
  create(@Req() req: AuthRequest, @Body(new SchemaPipe(taskSchema)) input: TaskInput) {
    return this.service.write(req.auth.userId, input);
  }
  @Put(':id')
  @ApiBody({ schema: { $ref: '#/components/schemas/TaskInput' } })
  update(
    @Req() req: AuthRequest,
    @Param('id', new SchemaPipe(idSchema)) id: string,
    @Body(new SchemaPipe(taskSchema)) input: TaskInput,
  ) {
    return this.service.write(req.auth.userId, input, id);
  }
  @Delete(':id')
  @HttpCode(204)
  remove(@Req() req: AuthRequest, @Param('id', new SchemaPipe(idSchema)) id: string) {
    return this.service.remove(req.auth.userId, id);
  }
}
