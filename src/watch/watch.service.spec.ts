import { EventEmitter2 } from '@nestjs/event-emitter';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection, Model } from 'mongoose';

import { ChartService } from '../chart/chart.service';
import { WatchService } from './watch.service';
import { CmsService } from './cms/cms.service';

import { Order, OrderSchema } from '../order/order.schema';
import { Watch, WatchSchema } from './watch.schema';
import { Chart, ChartSchema } from '../chart/chart.schema';

describe('WatchService', () => {
  let module: TestingModule;
  let service: WatchService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

  let orderModel: Model<Order>;
  let chartModel: Model<Chart>;
  let watchModel: Model<Watch>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    orderModel = mongoConnection.model(Order.name, OrderSchema);
    chartModel = mongoConnection.model(Chart.name, ChartSchema);
    watchModel = mongoConnection.model(Watch.name, WatchSchema);

    module = await Test.createTestingModule({
      providers: [
        WatchService,
        EventEmitter2,
        ChartService,
        CmsService,
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Chart.name), useValue: chartModel },
        { provide: getModelToken(Watch.name), useValue: watchModel },
      ],
    }).compile();

    service = module.get<WatchService>(WatchService);
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();

    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
