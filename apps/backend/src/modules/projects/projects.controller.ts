import { Controller, Post, Param, Body } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateProjectDto,
  EditProjectDto,
  CreateSubProjectDto,
  CreateSeasonDto,
  AddAccessDto,
} from '@asoode/shared';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ─── PROJECT CRUD ───────────────────────────────────────────

  @Post('list')
  list(@CurrentUser() userId: string) {
    return this.projectsService.list(userId);
  }

  @Post('archived')
  archived(@CurrentUser() userId: string) {
    return this.projectsService.archived(userId);
  }

  @Post(':id/fetch')
  fetch(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.projectsService.fetch(userId, id);
  }

  @Post('create')
  create(@CurrentUser() userId: string, @Body() body: CreateProjectDto) {
    return this.projectsService.create(userId, body);
  }

  @Post(':id/edit')
  edit(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: EditProjectDto,
  ) {
    return this.projectsService.edit(userId, id, body);
  }

  @Post(':id/remove')
  remove(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.projectsService.remove(userId, id);
  }

  @Post(':id/archive')
  archive(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.projectsService.archive(userId, id);
  }

  // ─── SUB-PROJECTS ──────────────────────────────────────────

  @Post(':id/sub/create')
  createSubProject(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: CreateSubProjectDto,
  ) {
    return this.projectsService.createSubProject(userId, id, body);
  }

  @Post('sub/:id/edit')
  editSubProject(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string },
  ) {
    return this.projectsService.editSubProject(userId, id, body);
  }

  @Post('sub/:id/remove')
  removeSubProject(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.projectsService.removeSubProject(userId, id);
  }

  @Post('sub/:id/order')
  orderSubProject(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { order: number },
  ) {
    return this.projectsService.orderSubProject(userId, id, body);
  }

  // ─── SEASONS ───────────────────────────────────────────────

  @Post(':id/season/create')
  createSeason(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: CreateSeasonDto,
  ) {
    return this.projectsService.createSeason(userId, id, body);
  }

  @Post('season/:id/edit')
  editSeason(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string },
  ) {
    return this.projectsService.editSeason(userId, id, body);
  }

  @Post('season/:id/remove')
  removeSeason(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.projectsService.removeSeason(userId, id);
  }

  // ─── ACCESS MANAGEMENT ────────────────────────────────────

  @Post(':id/add-access')
  addAccess(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: AddAccessDto,
  ) {
    return this.projectsService.addAccess(userId, id, body);
  }

  @Post('change-access/:id')
  changeAccess(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { access: number },
  ) {
    return this.projectsService.changeAccess(userId, id, body);
  }

  @Post('remove-access/:id')
  removeAccess(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.projectsService.removeAccess(userId, id);
  }

  @Post('change-pending-access/:id')
  changePendingAccess(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: { access: number },
  ) {
    return this.projectsService.changePendingAccess(userId, id, body);
  }

  @Post('remove-pending-access/:id')
  removePendingAccess(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.projectsService.removePendingAccess(userId, id);
  }

  // ─── REPORTS & ANALYTICS ──────────────────────────────────

  @Post('objectives/:id')
  objectives(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.projectsService.objectives(userId, id);
  }

  @Post('objectives/:id/detail')
  objectivesDetail(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.projectsService.objectivesDetail(userId, id);
  }

  @Post('tree/:id')
  tree(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.projectsService.tree(userId, id);
  }

  @Post('road-map/:id')
  roadMap(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.projectsService.roadMap(userId, id);
  }

  @Post('progress/:id')
  progress(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.projectsService.progress(userId, id);
  }
}
