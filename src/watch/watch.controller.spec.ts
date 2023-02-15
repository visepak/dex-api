import { EventEmitter2 } from '@nestjs/event-emitter';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection, Model } from 'mongoose';

import { WatchController } from './watch.controller';

import { ChartService } from '../chart/chart.service';
import { WatchService } from './watch.service';
import { CmsService } from './cms/cms.service';

import { Watch, WatchSchema } from './watch.schema';
import { Order, OrderSchema } from '../order/order.schema';
import { Chart, ChartSchema } from '../chart/chart.schema';

describe('WatchController', () => {
  let controller: WatchController;
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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WatchController],
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

    controller = module.get<WatchController>(WatchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
