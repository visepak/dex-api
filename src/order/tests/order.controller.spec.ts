import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect, Model } from 'mongoose';

import { OrderController } from '../order.controller';

import { OrderService } from '../order.service';
import { OrdersCacheService } from '../orders-cache.service';
import { OrdersCheckerService } from '../../blockchain/order-checker/orders-checker.service';
import { ChartService } from '../../chart/chart.service';
import { WatchService } from '../../watch/watch.service';
import { CmsService } from '../../watch/cms/cms.service';

import { Order, OrderSchema } from '../order.schema';
import { Chart, ChartSchema } from '../../chart/chart.schema';
import { Watch, WatchSchema } from '../../watch/watch.schema';

import { GetFilteredOrderBookDTOStub } from './stubs/GetFilteredOrderBookDTOStub';
import { OrderStub } from './stubs/OrderStub';
import { WatchStub } from './stubs/WatchDTOStub';

import { fromNativeToNumberUSDC } from '../../utils/decimalsConverter';

import { USDC_DECIMALS } from '../../app.config';

describe('OrderController', () => {
  let controller: OrderController;
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
      controllers: [OrderController],
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
    controller = app.get<OrderController>(OrderController);
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  describe('Get order-book', () => {
    it('should return order-book by watchId and minShareAmount parameters', async () => {
      await new watchModel(WatchStub).save();
      await new orderModel(OrderStub).save();

      const ordersBook = await controller.getOrderBook(
        GetFilteredOrderBookDTOStub,
      );

      expect(ordersBook.ordersToSell.length).toBe(0);
      expect(ordersBook.ordersToBuy.length).toBe(1);

      expect(ordersBook.ordersToBuy[0].orderData).toEqual(OrderStub.orderData);
      expect(ordersBook.ordersToBuy[0].signature).toEqual(OrderStub.signature);
      expect(ordersBook.ordersToBuy[0].shares).toEqual(
        OrderStub.shares.toString(),
      );
      expect(ordersBook.ordersToBuy[0].orderHash).toEqual(OrderStub.orderHash);

      expect(ordersBook.lastPrice).toBe(
        fromNativeToNumberUSDC(OrderStub.orderData.price).toFixed(
          USDC_DECIMALS,
        ),
      );
      expect(ordersBook.previousPrice).toBe('1.000000');
      expect(ordersBook.bestSellPrice).toBe(
        fromNativeToNumberUSDC(OrderStub.orderData.price).toFixed(
          USDC_DECIMALS,
        ),
      );
      expect(ordersBook.bestBuyPrice).toBe('1.000000');
    });
    // TODO
    // it('should return Exception if there is no watch with such watchId', () => {

    // });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
