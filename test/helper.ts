import { spawn } from 'child_process';

export const nsqTail = function (
  containerName: string,
  topic: string,
  tcpAddress: string,
) {
  return spawn('docker', [
    'exec',
    containerName,
    'nsq_tail',
    `--nsqd-tcp-address=${tcpAddress}`,
    `--topic=${topic}`,
    '--n=1',
  ]);
};
