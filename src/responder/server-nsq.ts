import { Server, CustomTransportStrategy } from '@nestjs/microservices';

import { Consumer } from 'nsq-strategies';

import { NsqOptions } from '../interfaces/nsq-options.interface';
import { InboundMessageDeserializer } from './inbound-message-deserializer';
import { NsqContext } from './nsq-context';

export class ServerNsq extends Server implements CustomTransportStrategy {
  private nsqConsumers: Consumer[];

  constructor(private readonly options: NsqOptions) {
    super();

    // super class establishes the serializer and deserializer; sets up
    // defaults unless overridden via `options`
    options.deserializer =
      options.deserializer || new InboundMessageDeserializer();
    this.initializeSerializer(options);
    this.initializeDeserializer(options);
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
    options: any,
  ): Consumer {
    const c = new Consumer(topic, channel, options || this.options);
    if (this.options.discardHandler) {
      c.reader.on('discard', this.options.discardHandler);
    }
    c.reader.on('error', (err: Error) => {
      this.logger.error(
        `consumer reader error: ${err}, topic: ${topic}, channel: ${channel}`,
      );
    });

    return c;
  }

  /**
   * kick things off
   */
  public start(callback: () => void) {
    // register faye message handlers
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

        const c = this.createConsumer(topic, channel, options);
        this.nsqConsumers.push(c);
        c.consume(async (msg: any) => {
          const nsqCtx = new NsqContext([topic, channel, msg.id]);
          const packet = await this.deserializer.deserialize(msg, {
            topic,
            channel,
          });
          try {
            await handler(packet.data, nsqCtx);
            msg.finish();
          } catch (err) {
            msg.requeue(this.options.requeueDelay || 90 * 1000);
          }
        });
      } else {
        throw new Error('MessageHandler deocrator is not implemented');
      }
    });
  }

  /**
   * close() is required by `CustomTransportStrategy`
   */
  public close() {
    this.nsqConsumers.forEach((c) => c.close());
  }
}
