import { Module } from '@nestjs/common';
import { WorkPackagesController } from './work-packages.controller';
import { WorkPackagesService } from './work-packages.service';
import { MessengerModule } from '../messenger/messenger.module';

@Module({
  imports: [MessengerModule],
  controllers: [WorkPackagesController],
  providers: [WorkPackagesService],
})
export class WorkPackagesModule {}
