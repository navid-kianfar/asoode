import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { NewFolderDto, RenameDto, DeleteDto } from '@asoode/shared';
import { Inject } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { FilesService } from './files.service';
import { IStorageService, STORAGE_SERVICE } from '../../common/storage';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  @Post('mine')
  mine(
    @CurrentUser() userId: string,
    @Body() body: { path: string },
  ) {
    return this.filesService.mine(userId, body.path);
  }

  @Post('shared-by-me')
  sharedByMe(
    @CurrentUser() userId: string,
    @Body() body: { path: string },
  ) {
    return this.filesService.sharedByMe(userId, body.path);
  }

  @Post('shared-by-others')
  sharedByOthers(
    @CurrentUser() userId: string,
    @Body() body: { path: string },
  ) {
    return this.filesService.sharedByOthers(userId, body.path);
  }

  @Post('new-folder')
  newFolder(
    @CurrentUser() userId: string,
    @Body() body: NewFolderDto,
  ) {
    return this.filesService.newFolder(userId, body);
  }

  @Post('rename')
  rename(
    @CurrentUser() userId: string,
    @Body() body: RenameDto,
  ) {
    return this.filesService.rename(userId, body);
  }

  @Post('delete')
  delete(
    @CurrentUser() userId: string,
    @Body() body: DeleteDto,
  ) {
    return this.filesService.delete(userId, body);
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  upload(
    @CurrentUser() userId: string,
    @Body() body: { path: string },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.filesService.upload(userId, body.path, files);
  }
}

@Controller('storage')
export class StorageController {
  constructor(@Inject(STORAGE_SERVICE) private readonly storage: IStorageService) {}

  @Post('download')
  async download(
    @CurrentUser() _userId: string,
    @Body() body: { key: string },
    @Res() res: Response,
  ) {
    try {
      const stream = await this.storage.getStream(body.key);
      const ext = body.key.split('.').pop()?.toLowerCase() || '';
      const contentType = this.getContentType(ext);
      res.set({ 'Content-Type': contentType });
      stream.pipe(res);
    } catch {
      res.status(404).json({ message: 'File not found' });
    }
  }

  @Get('file/*path')
  @Public()
  async serveFile(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Extract everything after /storage/file/ from the URL path
    const prefix = '/storage/file/';
    const idx = req.path.indexOf(prefix);
    const key = idx !== -1 ? decodeURIComponent(req.path.slice(idx + prefix.length)) : '';
    if (!key) {
      res.status(400).json({ message: 'Missing file key' });
      return;
    }
    try {
      const stream = await this.storage.getStream(key);
      const ext = key.split('.').pop()?.toLowerCase() || '';
      const contentType = this.getContentType(ext);
      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Content-Disposition': 'inline',
      });
      stream.pipe(res);
    } catch {
      res.status(404).json({ message: 'File not found' });
    }
  }

  @Post('presigned-url')
  async presignedUrl(
    @CurrentUser() _userId: string,
    @Body() body: { key: string },
  ) {
    const url = await this.storage.getPresignedUrl(body.key, 3600);
    return { url };
  }

  private getContentType(ext: string): string {
    const map: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
      pdf: 'application/pdf',
      mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
      mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
      doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      zip: 'application/zip', rar: 'application/x-rar-compressed',
      txt: 'text/plain', json: 'application/json', xml: 'application/xml',
    };
    return map[ext] || 'application/octet-stream';
  }
}
