import { Controller, Get, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MiscService } from './misc.service';

@Controller()
export class MiscController {
  constructor(private readonly miscService: MiscService) {}

  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Public()
  @Post('captcha')
  captcha() {
    return this.miscService.captcha();
  }

  @Public()
  @Post('enums')
  enums() {
    return this.miscService.enums();
  }

  @Post('reports/dashboard')
  dashboard(@CurrentUser() userId: string) {
    return this.miscService.dashboard(userId);
  }

  @Post('reports/recent-activities')
  recentActivities(@CurrentUser() userId: string) {
    return this.miscService.recentActivities(userId);
  }
}
