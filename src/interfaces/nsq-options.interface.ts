import { LoggerService, LogLevel } from '@nestjs/common';
import { Serializer, ConsumerDeserializer } from '@nestjs/microservices';

// TODO extend the CustomClientOptions?
// TODO split with producer/consumer options?
export interface NsqOptions {
  lookupdHTTPAddresses?: string[];
  strategy?: string; // FIXME with Producer.strategy enum
  discardHandler?: (arg: any) => void;
  maxInFlight?: number;
  requeueDelay?: number;
  lookupdPollInterval?: number;
  maxAttempts?: number;
  serializer?: Serializer;
  deserializer?: ConsumerDeserializer;
  logger?: LoggerService | LogLevel[] | false;
}

export type NsqConsumerOptions = Pick<
  NsqOptions,
  'discardHandler' | 'requeueDelay' | 'maxAttempts' | 'lookupdPollInterval'
>;
