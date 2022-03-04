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
}
