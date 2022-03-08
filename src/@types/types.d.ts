declare module 'nsq-strategies' {
  declare class Consumer {
    constructor(topic: any, channel: any, options: any);
    opt: any;
    reader: any;
    connect(): void;
    consume(fn: any): void;
    close(): void;
  }
  declare class Producer {
    constructor(config: any, options: any);
    opts: any;
    lookupdCluster: any;
    strategy: any;
    connect(): Promise<any>;
    conns: any[];
    produce(
      topic: any,
      msg: any,
      options: Record<string, any>,
      callback: any,
    ): any;
    close(): void;
  }
  declare namespace Producer {
    export const ROUND_ROBIN: string;
    export const FAN_OUT: string;
    export { singleton };
  }
  declare function singleton(config: any, opt: any, cb: any): void;

  declare namespace api {
    declare class Nsqd {
      constructor(nsqdAddr: string);
      publish(topic: any, message: any): any;
      deferPublish(topic: any, message: any, defer: any): any;
      createTopic(topic: any): any;
      deleteTopic(topic: any): any;
      emptyTopic(topic: any): any;
      createChannel(topic: any, channel: any): any;
      deleteChannel(topic: any, channel: any): any;
      emptyChannel(topic: any, channel: any): any;
    }
  }
}
