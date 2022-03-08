# Nestjs Transporter For NSQ

## Overview

This library provides a nestjs transporter by taking NSQ as its message broker. We could simply take the concept of a transporter as an event-driven framework as follows:

- As a message producer, I could send a message to NSQ to various topics by emitting various events based on the topic names.
- As a message consumer, I could receive a message by subscribing to those emitted events.

For more details on the overall
architecture, please kinldy refer to this [article](https://dev.to/nestjs/integrate-nestjs-with-external-services-using-microservice-transporters-part-1-p3)

## Restriction

This library has not implement the request-response communication style and currently it only supports the event-dispatching styple.

## Produce a message

### Add the nsq client provider in your module's definition:

```typescript
import { DynamicModule, Module } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ClientNsq, NsqOptions } from 'nestjs-nsq-transporter';

@Module({
  providers: [
    {
      provide: 'NSQ_CLIENT',
      useFactory: (): ClientProxy => new ClientNsq(options),
    }
    SomeService,
  ],
})
export class SomeModule {}
```

### Then you can inject the ClientNsq instance and use it to emit the message event:

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class SomeService {
  constructor(@Inject('NSQ_CLIENT') private nsqProducer: ClientNsq) {}

  sendMessage(topic: string, msg: any) {
    return this.nsqProducer.emit(topic, msg);
  }
}
```

## Receive a message

### Connect to the nsq microservice in your app and specify the nsq options as follows:

```typescript
import { MicroserviceOptions } from '@nestjs/microservices';
import { serverNsq } from 'nestjs-nsq-transporter';

app.connectMicroservice<MicroserviceOptions>({
  strategy: new ServerNsq(options),
});
```

### Then use @EventPattern to mark a function as the handler for messages from specific event pattern:

```typescript
import { Injectable } from '@nestjs/common';
import { EventPattern, Ctx, Payload } from '@nestjs/microservices';

@Injectable()
export class SomeService {

  @EventPattern({
    topic: 'topic1',
    channel: 'channel1',
  })
  messageHandlerForTopic1(@Payload() payload: any, @Ctx() context: NsqContext)
    // Handle messages
  }
}
```

## Definition of NsqOptions

The `options` that passed to either `ServerNsq` or `ClientNsq` has the type as NsqOptions and the available fields are as folows:

|      Field Name      | Is Required |                      Type                       |                                                                           Description                                                                            |              Example               |
| :------------------: | :---------: | :---------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------: |
| lookupdHTTPAddresses |     No      |                   `string[]`                    |                                                                http address list for nsq lookupds                                                                |    `['http://localhost:4161']`     |
|       strategy       |     No      |          `'round_robin' or 'fan_out'`           |                                                                     message sending strategy                                                                     |           `round_robin`            |
|    discardHandler    |     No      |              `(arg: any) => void`               |                                                      handler function to process when message is discarded                                                       |  `(arg: any) => console.log(arg)`  |
|     maxInFlight      |     No      |                    `number`                     |                                                        The maximum number of messages to process at once                                                         |                `1`                 |
|     requeueDelay     |     No      |                    `number`                     |                        The default amount of time (milliseconds) a message requeued should be delayed by before being dispatched by nsqd.                        |              `90000`               |
| lookupdPollInterval  |     No      |                    `number`                     |                                                     The frequency in seconds for querying lookupd instances.                                                     |                `60`                |
|     maxAttempts      |     No      |                    `number`                     | The number of times a given message will be attempted (given to MESSAGE handler) before it will be handed to the DISCARD handler and then automatically finished |                `3`                 |
|      serializer      |     No      |      `Serializer in @nestjs/microservices`      |                             The instance of `Serializer` class which provides a `serialize` method to serialize the outbound message                             |  `serialize(value: any) => value`  |
|     deserializer     |     No      | `ConsumerDeserializer in @nestjs/microservices` |                      The instance of `ConsumerDeserializer` class which provides a `deserialize` method to deserialize the inbound message                       | `deserialize(value: any) => value` |
