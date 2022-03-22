import { Serializer } from '@nestjs/microservices';

export class OutboundEventSerializer implements Serializer {
  serialize(value: any) {
    // nest client-proxy class wraps the 2nd param of `emit` with a `data` property
    if (!value.data) {
      return value;
    }
    const { options, meta, ...payload } = value.data;

    return {
      meta: {
        ...(value.meta || {}),
        transactionId: meta?.transactionId,
        component: meta?.component || 'nestjs-nsq-transporter',
        timestamp: new Date().toISOString(),
      },
      data: payload,
      options: options || {},
    };
  }
}
