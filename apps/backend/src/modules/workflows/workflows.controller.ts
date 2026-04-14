import { Controller, Post, Param, Body } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateWorkflowDto, EditWorkflowDto } from '@asoode/shared';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post('list')
  list(@CurrentUser() userId: string) {
    return this.workflowsService.list(userId);
  }

  @Post('create')
  create(@CurrentUser() userId: string, @Body() body: CreateWorkflowDto) {
    return this.workflowsService.create(userId, body);
  }

  @Post(':id/fetch')
  fetch(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workflowsService.fetch(userId, id);
  }

  @Post(':id/edit')
  edit(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() body: EditWorkflowDto,
  ) {
    return this.workflowsService.edit(userId, id, body);
  }

  @Post(':id/remove')
  remove(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workflowsService.remove(userId, id);
  }

  @Post(':id/toggle')
  toggle(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workflowsService.toggle(userId, id);
  }

  @Post(':id/execute')
  execute(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workflowsService.execute(userId, id);
  }

  @Post(':id/executions')
  executions(@CurrentUser() userId: string, @Param('id') id: string) {
    return this.workflowsService.executions(userId, id);
  }
}
