import { BullModule } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection, Model } from 'mongoose';

import { OrdersCheckerService } from '../../blockchain/order-checker/orders-checker.service';
import { ChartService } from '../../chart/chart.service';
import { CmsService } from '../../watch/cms/cms.service';
import { OrderService } from '../order.service';
import { OrdersCacheService } from '../orders-cache.service';
import { WatchService } from '../../watch/watch.service';

import { Watch, WatchSchema } from '../../watch/watch.schema';
import { Order, OrderSchema } from '../order.schema';
import { Chart, ChartSchema } from '../../chart/chart.schema';

describe('OrderService', () => {
  let service: OrderService;
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

    const app: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.registerQueue({
          name: 'create-order',
        }),
      ],
      providers: [
        OrderService,
        OrdersCacheService,
        OrdersCheckerService,
        EventEmitter2,
        ChartService,
        WatchService,
        CmsService,
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Chart.name), useValue: chartModel },
        { provide: getModelToken(Watch.name), useValue: watchModel },
      ],
    }).compile();

    service = app.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
