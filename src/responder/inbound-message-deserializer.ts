import { ConsumerDeserializer, IncomingRequest } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

export class InboundMessageDeserializer implements ConsumerDeserializer {
  private readonly logger = new Logger('InboundMessageIdentityDeserializer');

  deserialize(value: any, options?: Record<string, any>): IncomingRequest {
    let json;

    try {
      json = value.json();
    } catch (err) {}

    this.logger.verbose(
      `<<-- deserializing inbound message:\n
${(json && JSON.stringify(json)) || value.body}
\n\twith options: ${JSON.stringify(options)}`,
    );

    return {
      id: value.id,
      data: json || value.body,
      pattern: options,
    };
  }
}
