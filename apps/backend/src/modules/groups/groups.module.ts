import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { MessengerModule } from '../messenger/messenger.module';

@Module({
  imports: [MessengerModule],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
