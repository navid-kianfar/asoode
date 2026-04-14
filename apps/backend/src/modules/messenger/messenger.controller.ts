import {
  Controller,
  Post,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SendMessageDto } from '@asoode/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MessengerService } from './messenger.service';


@Controller('messenger')
export class MessengerController {
  constructor(private readonly messengerService: MessengerService) {}

  @Post('channels')
  channels(@CurrentUser() userId: string) {
    return this.messengerService.channels(userId);
  }

  @Post('channel/:recordId/fetch')
  fetch(
    @CurrentUser() userId: string,
    @Param('recordId') recordId: string,
  ) {
    return this.messengerService.fetch(userId, recordId);
  }

  @Post('channel/:recordId/send')
  send(
    @CurrentUser() userId: string,
    @Param('recordId') recordId: string,
    @Body() body: SendMessageDto,
  ) {
    return this.messengerService.send(userId, recordId, body);
  }

  @Post('channel/:recordId/attach')
  @UseInterceptors(FileInterceptor('file'))
  attach(
    @CurrentUser() userId: string,
    @Param('recordId') recordId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.messengerService.attach(userId, recordId, file);
  }

  @Post('channel/:recordId/files')
  channelFiles(
    @CurrentUser() userId: string,
    @Param('recordId') recordId: string,
  ) {
    return this.messengerService.channelFiles(userId, recordId);
  }
}
