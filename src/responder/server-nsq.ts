import { Server, CustomTransportStrategy } from '@nestjs/microservices';

import { Consumer } from 'nsq-strategies';
import { Logger } from '@nestjs/common';

import {
  NsqConsumerOptions,
  NsqOptions,
} from '../interfaces/nsq-options.interface';
import { InboundMessageDeserializer } from './inbound-message-deserializer';
import { NsqContext } from './nsq-context';
import { firstValueFrom, isObservable, Observable } from 'rxjs';

export class ServerNsq extends Server implements CustomTransportStrategy {
  private nsqConsumers: Consumer[];

  constructor(private readonly options: NsqOptions) {
    super();
    this.applyLogger(options);

    // super class establishes the serializer and deserializer; sets up
    // defaults unless overridden via `options`
    options.deserializer =
      options.deserializer || new InboundMessageDeserializer();
    this.initializeSerializer(options);
    this.initializeDeserializer(options);
  }
  private applyLogger(options: NsqOptions) {
    if (!options || options.logger == null) {
      return;
    }
    Logger.overrideLogger(options.logger);
  }

  /**
   * listen() is required by `CustomTransportStrategy` It's called by the
   * framework when the transporter is instantiated, and kicks off a lot of
   * the machinery.
   */
  public listen(callback: () => void) {
    this.nsqConsumers = [];

    this.start(callback);
  }

  private createConsumer(
    topic: string,
    channel: string,
    options: NsqConsumerOptions,
  ): Consumer {
    const c = new Consumer(topic, channel, options);

    if (options.discardHandler) {
      const consumer$ = c.toRx('discard');
      consumer$.subscribe((msg) => {
        return options.discardHandler(msg);
      });
    }

    return c;
  }

  /**
   * kick things off
   */
  public start(callback: () => void) {
    // register message handlers
    this.bindHandlers();

    // call any user-supplied callback from `app.listen()` call
    callback();
  }

  /**
   *
   */
  public bindHandlers() {
    /**
     * messageHandlers is populated by the Framework (on the `Server` superclass)
     *
     * It's a map of `pattern` -> `handler` key/value pairs
     * `handler` is the handler function in the user's controller class, decorated
     * by `@MessageHandler` or `@EventHandler`
     */

    this.messageHandlers.forEach((handler, pattern) => {
      if (handler.isEventHandler) {
        const { topic, channel, options } = JSON.parse(pattern);

        const consumerOptions = this.transformToConsumerOptions(options);

        const DEFAULT_REQUEUE_DELAY = 90 * 1000;
        const c = this.createConsumer(topic, channel, consumerOptions);

        this.nsqConsumers.push(c);
        c.consume(async (msg: any) => {
          this.logger.log(
            `consumer reader on message: ${msg.body.toString()}, topic: ${topic}, channel: ${channel}`,
          );
          const nsqCtx = new NsqContext([topic, channel, msg.id]);
          const packet = await this.deserializer.deserialize(msg, {
            topic,
            channel,
          });
          let source: Promise<any> | Observable<any>;
          try {
            source = await handler(packet.data, nsqCtx);
          } catch (err) {
            this.logger.error(
              `consumer reader failed to process message with error: ${err.message}, topic: ${topic}, channel: ${channel}`,
            );
            msg.requeue(consumerOptions.requeueDelay || DEFAULT_REQUEUE_DELAY);
            return;
          }
          if (!isObservable(source)) {
            // call finish if resoved promise
            return msg.finish();
          }
          try {
            await firstValueFrom(source);
          } catch (err) {
            if (err.name === 'EmptyError') {
              return msg.finish();
            }
            this.logger.error(
              `consumer reader failed to process message with Observable error: ${err.message}, topic: ${topic}, channel: ${channel}`,
            );
            msg.requeue(consumerOptions.requeueDelay || DEFAULT_REQUEUE_DELAY);
            return;
          }
          msg.finish();
        });
      } else {
        throw new Error('MessageHandler decorator is not implemented');
      }
    });
  }

  private transformToConsumerOptions(options: NsqOptions): NsqConsumerOptions {
    return Object.assign({}, this.options, options);
  }

  /**
   * close() is required by `CustomTransportStrategy`
   */
  public close() {
    this.nsqConsumers.forEach((c) => c.close());
  }
}
