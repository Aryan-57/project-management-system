import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { config } from './config';
import { Database } from './database';
import { AuthController, AuthService, SessionGuard } from './auth';
import { ProjectsController, ProjectsService } from './projects';
import { TasksController, TasksService } from './tasks';
import { DashboardController } from './dashboard';
import { RequestShapeGuard } from './http';
@Module({
  imports: [JwtModule.register({ secret: config.JWT_SECRET })],
  controllers: [AuthController, ProjectsController, TasksController, DashboardController],
  providers: [
    Database,
    AuthService,
    ProjectsService,
    TasksService,
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RequestShapeGuard },
  ],
})
export class AppModule {}
