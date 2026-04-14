import { Controller, Post, Param, Body } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TimesService } from './times.service';

@Controller('times')
export class TimesController {
  constructor(private readonly timesService: TimesService) { }

  @Post('mine')
  mine(
    @CurrentUser() userId: string,
    @Body() body: { from?: string; to?: string },
  ) {
    return this.timesService.mine(userId, body?.from, body?.to);
  }

  @Post('group/:id')
  group(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
    @Body() body: { from?: string; to?: string },
  ) {
    const from = body?.from || '';
    const to = body?.to || '';

    return this.timesService.group(userId, groupId, from, to);
  }
}
