import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MicroserviceOptions } from '@nestjs/microservices';
import * as request from 'supertest';
import { AppModule } from './test-app/app.module';
import { NsqContext, ServerNsq } from '../src';
import { api } from 'nsq-strategies';
import { setTimeout } from 'timers/promises';
import { v4 as uuid } from 'uuid';
import { AppController } from './test-app/app.controller';
import { nsqTail } from './helper';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let controller: AppController;
  let nsqd;
  beforeAll(async () => {
    const nsqdHTTPAddress = 'http://localhost:4151';
    const lookupdHttpAddrs = ['http://localhost:4161'];

    nsqd = new api.Nsqd(nsqdHTTPAddress);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule.configure({
          client: {
            lookupdHTTPAddresses: lookupdHttpAddrs,
          },
        }),
      ],
    }).compile();
    controller = moduleFixture.get<AppController>(AppController);
    app = moduleFixture.createNestApplication();
    app.connectMicroservice<MicroserviceOptions>({
      strategy: new ServerNsq({
        lookupdHTTPAddresses: lookupdHttpAddrs,
        lookupdPollInterval: 1,
      }),
    });

    await app.startAllMicroservices();
    await app.init();
  });

  it('should be able to receive msg with eventPattern', async () => {
    const topic = 'topic01';
    await nsqd.createTopic('topic01'); // otherwise it fails on the 1st time as topic does not exist
    await setTimeout(1500); // wait 1.5s for consumer polls the topic
    const eventId = uuid();
    await nsqd.publish(topic, { eventId, foo: 'bar' });
    let onEventPatternCall: { payload: any; context: NsqContext } | undefined;
    while (!onEventPatternCall) {
      await setTimeout(1000);
      onEventPatternCall = controller.getOnEventPatternCall(eventId);
    }
    expect(onEventPatternCall).toBeDefined();
    expect(onEventPatternCall.payload).toEqual({ eventId, foo: 'bar' });
  });

  it('should be able to dispatch event', async () => {
    await request(app.getHttpServer())
      .post('/dispatch/topic02')
      .send({ ipsum: 'lorem02' })
      .expect(200);
    return new Promise((resolve, reject) => {
      nsqTail(
        'nestjs_nsq_transporter_nsqd',
        'topic02',
        '0.0.0.0:4150',
      ).stdout.on('data', (data: unknown) => {
        const normalized = data.toString().trim();
        // sometimes nsqTails returns empty string that we are not interested in
        if (normalized === '') return;

        const json = JSON.parse(normalized);
        try {
          expect(json).toHaveProperty('meta');
          expect(json.data).toEqual({ ipsum: 'lorem02' });
        } catch (err) {
          return reject(err);
        }
        resolve(json);
      });
    });
  });
  it('should be able to specify produce options', async () => {
    await request(app.getHttpServer())
      .post('/dispatch/topic03')
      .send({ ipsum: 'lorem03', options: { retry: { retries: 3 } } })
      .expect(200);
    return new Promise((resolve, reject) => {
      nsqTail(
        'nestjs_nsq_transporter_nsqd',
        'topic03',
        '0.0.0.0:4150',
      ).stdout.on('data', (data: unknown) => {
        const normalized = data.toString().trim();
        if (normalized === '') return;
        const json = JSON.parse(normalized);
        try {
          expect(json).toHaveProperty('meta');
          expect(json.data).toEqual({ ipsum: 'lorem03' });
        } catch (err) {
          return reject(err);
        }
        resolve(json);
      });
    });
  });
  it('should be able to pub sub with nestjs pattern', async () => {
    const eventId = uuid();
    await request(app.getHttpServer())
      .post('/dispatch/topic04')
      .send({ eventId, ipsum: 'lorem04' })
      .expect(200);
    let onEventPatternCall: { payload: any; context: NsqContext } | undefined;
    while (!onEventPatternCall) {
      await setTimeout(1000);
      onEventPatternCall = controller.getOnEventPatternCall(eventId);
    }
    expect(onEventPatternCall).toBeDefined();
    expect(onEventPatternCall.payload).toEqual({ eventId, ipsum: 'lorem04' });
  });
});
