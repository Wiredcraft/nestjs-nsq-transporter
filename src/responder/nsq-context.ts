import { BaseRpcContext } from '@nestjs/microservices/ctx-host/base-rpc.context';

type NsqContextArgs = [string, string, string];

export class NsqContext extends BaseRpcContext<NsqContextArgs> {
  constructor(args: NsqContextArgs) {
    super(args);
  }

  getTopic() {
    return this.args[0];
  }

  getChannel() {
    return this.args[1];
  }
  getMsgId() {
    return this.args[2];
  }
}
