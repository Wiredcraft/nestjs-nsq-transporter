import { Logger } from '@nestjs/common';
import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';

import { Producer, PRODUCER_STRATEGY } from 'nsq-strategies';
import { NsqOptions } from '../interfaces/nsq-options.interface';
import { OutboundEventSerializer } from './outbound-event-serializer';

export class ClientNsq extends ClientProxy {
  protected readonly logger = new Logger(ClientProxy.name);
  protected readonly subscriptionsCount = new Map<string, number>();
  protected producer: Producer;
  protected connection: Promise<any>;

  constructor(protected readonly options?: NsqOptions) {
    super();

    options.serializer = options.serializer || new OutboundEventSerializer();
    this.initializeSerializer(options);
    this.initializeDeserializer(options);
  }

  protected publish(
    partialPacket: ReadPacket,
    callback: (packet: WritePacket) => void,
  ): () => void {
    throw new Error('not implemented');
  }

  protected dispatchEvent(packet: ReadPacket): Promise<any> {
    const pattern = this.normalizePattern(packet.pattern);
    const serializedPacket = this.serializer.serialize(packet);

    const { data, meta, options } = serializedPacket;
    return this.producer.produce(pattern, { meta, data }, options);
  }

  /**
   * connect -
   * establishes a bunch of connections to the nsqds
   * returns a Promise that resolves to a set of nsqd connections.
   *
   * It converts an observable (connect$), which has some convenience features
   * that handle connection up/down events, into a promise.
   *
   * This construct is expected by the framework.
   */
  // TODO lazy or hot?
  public async connect(): Promise<any> {
    if (this.producer) {
      return this.producer;
    }
    const { lookupdHTTPAddresses, strategy = PRODUCER_STRATEGY.ROUND_ROBIN } =
      this.options;
    const producer = new Producer({ lookupdHTTPAddresses }, { strategy });
    await producer.connect();
    this.producer = producer;
    return this.producer;
  }

  public close() {
    this.producer.close();
    this.producer = null;
  }
}
