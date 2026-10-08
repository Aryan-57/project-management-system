import { Controller, Get, Inject, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Database } from './database';
import { AuthRequest } from './http';
import { Public } from './auth';
@ApiTags('Dashboard')
@Controller()
export class DashboardController {
  constructor(@Inject(Database) private readonly db: Database) {}
  @Get('dashboard')
  @ApiCookieAuth('session')
  @ApiBearerAuth()
  async dashboard(@Req() req: AuthRequest) {
    const ownerId = req.auth.userId;
    const project = { ownerId };
    const [totalProjects, totalTasks, completedTasks, pendingTasks, projectsInProgress] =
      await this.db.$transaction([
        this.db.project.count({ where: { ownerId } }),
        this.db.task.count({ where: { project } }),
        this.db.task.count({ where: { project, status: 'COMPLETED' } }),
        this.db.task.count({ where: { project, status: 'PENDING' } }),
        this.db.project.count({ where: { ownerId, status: 'IN_PROGRESS' } }),
      ]);
    return { totalProjects, totalTasks, completedTasks, pendingTasks, projectsInProgress };
  }
  @Public()
  @Get('health')
  async health() {
    await this.db.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
