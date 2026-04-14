import { Controller, Post, Body, Logger } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SearchService } from './search.service';

@Controller()
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  @Post('search')
  async search(
    @CurrentUser() userId: string,
    @Body() body: { query: string },
  ) {
    this.logger.debug(`Search request: userId=${userId}, query="${body.query}"`);
    const result = await this.searchService.search(userId, body.query);
    this.logger.debug(
      `Search results: tasks=${result.tasks.length}, projects=${result.projects.length}, groups=${result.groups.length}, members=${result.members.length}`,
    );
    return result;
  }
}
