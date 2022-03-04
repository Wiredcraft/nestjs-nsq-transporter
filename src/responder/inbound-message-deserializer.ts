import { ConsumerDeserializer, IncomingRequest } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

export class InboundMessageDeserializer implements ConsumerDeserializer {
  private readonly logger = new Logger('InboundMessageIdentityDeserializer');

  deserialize(value: any, options?: Record<string, any>): IncomingRequest {
    let msg;
    try {
      msg = value.json();
    } catch (err) {
      msg = value;
    }

    this.logger.verbose(
      `<<-- deserializing inbound message:\n
${msg}
\n\twith options: ${JSON.stringify(options)}`,
    );
    return {
      id: msg.id,
      data: msg,
      pattern: options,
    };
  }
}
