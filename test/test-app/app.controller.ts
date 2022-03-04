import {
  Inject,
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
} from '@nestjs/common';
import { EventPattern, Ctx, Payload } from '@nestjs/microservices';
import { Observable } from 'rxjs';

import { NsqContext, ClientNsq } from '../../src';

@Controller()
export class AppController {
  private readonly onEventPatternCalls: Map<
    string,
    { payload: any; context: NsqContext }
  >;

  constructor(@Inject('NSQ_CLIENT') private nsqProducer: ClientNsq) {
    this.onEventPatternCalls = new Map();
  }

  @Get()
  getHello(): string {
    return 'hello';
  }

  @Post('/dispatch/:topic')
  @HttpCode(200)
  disPatchNsq(@Param('topic') topic, @Body() msg: any): Observable<any> {
    return this.nsqProducer.emit(topic, msg);
  }

  @EventPattern({
    topic: 'topic01',
    channel: 'channel01',
  })
  onEventPattern(@Payload() payload: any, @Ctx() context: NsqContext): string {
    if (payload.eventId) {
      this.onEventPatternCalls.set(payload.eventId, {
        payload: payload,
        context: context,
      });
    }

    return 'Event: Ok';
  }

  @EventPattern({
    topic: 'topic04',
    channel: 'channel04',
  })
  onEventPattern2(@Payload() payload: any, @Ctx() context: NsqContext): string {
    if (payload.data && payload.data.eventId) {
      this.onEventPatternCalls.set(payload.data.eventId, {
        payload: payload.data,
        context: context,
      });
    }

    return 'Event: Ok';
  }

  getOnEventPatternCall(
    id: string,
  ): { payload: any; context: NsqContext } | undefined {
    return this.onEventPatternCalls.get(id);
  }
}
