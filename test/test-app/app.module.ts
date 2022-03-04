import { DynamicModule, Module } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { ClientNsq } from '../../src/requestor/nsq-client';
import { NsqOptions } from '../../src/interfaces/nsq-options.interface';

@Module({})
export class AppModule {
  static configure(options: { client: NsqOptions }): DynamicModule {
    return {
      module: AppModule,
      controllers: [AppController],
      providers: [
        {
          provide: 'NSQ_CLIENT',
          useFactory: (): ClientProxy => new ClientNsq(options.client),
        },
      ],
    };
  }
}
