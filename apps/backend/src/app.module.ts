import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import {
  serverConfig,
  databaseConfig,
  jwtConfig,
  rabbitmqConfig,
  minioConfig,
  storageConfig,
} from './common/config/configuration';
import { configValidationSchema } from './common/config/config.validation';
import { AuthGuard } from './common/guards/auth.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { PrismaService } from './common/services/prisma.service';
import { QueuePublisherService } from './common/services/queue-publisher.service';
import { SignalService } from './common/services/signal.service';
import { DomainEventService } from './common/services/domain-event.service';
import { DomainEventListener } from './common/listeners/domain-event.listener';
import { STORAGE_SERVICE } from './common/storage/storage.interface';
import { MinioStorageService } from './common/storage/minio-storage.service';
import { LocalStorageService } from './common/storage/local-storage.service';
import { AccountModule } from './modules/account/account.module';
import { GroupsModule } from './modules/groups/groups.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { WorkPackagesModule } from './modules/work-packages/work-packages.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { MessengerModule } from './modules/messenger/messenger.module';
import { FilesModule } from './modules/files/files.module';
import { TimesModule } from './modules/times/times.module';
import { SearchModule } from './modules/search/search.module';
import { MiscModule } from './modules/misc/misc.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [serverConfig, databaseConfig, jwtConfig, rabbitmqConfig, minioConfig, storageConfig],
      validationSchema: configValidationSchema,
      validationOptions: { abortEarly: true },
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    AccountModule,
    GroupsModule,
    ProjectsModule,
    WorkPackagesModule,
    TasksModule,
    MessengerModule,
    FilesModule,
    TimesModule,
    SearchModule,
    MiscModule,
    WorkflowsModule,
  ],
  providers: [
    PrismaService,
    QueuePublisherService,
    SignalService,
    DomainEventService,
    DomainEventListener,
    {
      provide: STORAGE_SERVICE,
      useFactory: async (configService: ConfigService) => {
        const driver = configService.get<string>('storage.driver', 'minio');
        const service =
          driver === 'local'
            ? new LocalStorageService(configService)
            : new MinioStorageService(configService);
        await service.onModuleInit();
        return service;
      },
      inject: [ConfigService],
    },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
  exports: [PrismaService, QueuePublisherService, SignalService, DomainEventService, STORAGE_SERVICE],
})
export class AppModule {}
