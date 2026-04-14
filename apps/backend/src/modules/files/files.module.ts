import { Module } from '@nestjs/common';
import { FilesController, StorageController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  controllers: [FilesController, StorageController],
  providers: [FilesService],
})
export class FilesModule {}
