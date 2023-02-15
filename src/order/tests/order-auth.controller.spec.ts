import { Test, TestingModule } from '@nestjs/testing';
import { BullModule } from '@nestjs/bull';
import { getModelToken } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TelegrafModule } from 'nestjs-telegraf';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection, Model } from 'mongoose';

import { OrderAuthController } from '../order-auth.controller';

import { OrderService } from '../order.service';
import { DealService } from '../../deal/deal.service';
import { OrdersCacheService } from '../orders-cache.service';
import { OrdersCheckerService } from '../../blockchain/order-checker/orders-checker.service';
import { ChartService } from '../../chart/chart.service';
import { WatchService } from '../../watch/watch.service';
import { CmsService } from '../../watch/cms/cms.service';
import { TelegramService } from '../../user/telegram.service';
import { UserService } from '../../user/user.service';
import { EmailService } from '../../user/email.service';

import { Order, OrderSchema } from '../order.schema';
import { Deal, DealSchema } from '../../deal/deal.schema';
import { BcEvent, BcEventSchema } from '../../blockchain/event/bc-event.schema';
import { Chart, ChartSchema } from '../../chart/chart.schema';
import { User, UserSchema } from '../../user/user.schema';
import { Watch, WatchSchema } from '../../watch/watch.schema';

import { ENV } from '../../app.config';

describe('OrderAuthController', () => {
  let controller: OrderAuthController;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

  let orderModel: Model<Order>;
  let dealModel: Model<Deal>;
  let bcEventModel: Model<BcEvent>;
  let chartModel: Model<Chart>;
  let userModel: Model<User>;
  let watchModel: Model<Watch>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    orderModel = mongoConnection.model(Order.name, OrderSchema);
    dealModel = mongoConnection.model(Deal.name, DealSchema);
    bcEventModel = mongoConnection.model(BcEvent.name, BcEventSchema);
    chartModel = mongoConnection.model(Chart.name, ChartSchema);
    userModel = mongoConnection.model(User.name, UserSchema);
    watchModel = mongoConnection.model(Watch.name, WatchSchema);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.registerQueue({
          name: 'create-order',
        }),
        TelegrafModule.forRoot({ token: ENV.TG_BOT_TOKEN }),
      ],
      controllers: [OrderAuthController],
      providers: [
        OrderService,
        DealService,
        OrdersCacheService,
        OrdersCheckerService,
        EventEmitter2,
        ChartService,
        WatchService,
        CmsService,
        UserService,
        EmailService,
        TelegramService,
        { provide: getModelToken(Order.name), useValue: orderModel },
        { provide: getModelToken(Deal.name), useValue: dealModel },
        { provide: getModelToken(BcEvent.name), useValue: bcEventModel },
        { provide: getModelToken(Chart.name), useValue: chartModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Watch.name), useValue: watchModel },
      ],
    }).compile();

    controller = module.get<OrderAuthController>(OrderAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  }, 60000);

  // it('test find order to fill', async () => {
  //   const request = {
  //     watchId: '1',
  //     shares: '1000',
  //     price: '2.00000',
  //     orderType: '0',
  //   };

  //   const result = await controller.findOrderToFill('', request);
  //   console.log(result);
  // }, 60000);

  // it('test filtered order-book', async () => {
  //   const request = {
  //     watchId: '1',
  //     minSharesAmount: '100000',
  //   };
  //
  //   const result = await controller.getFilteredOrderBook(request);
  //   console.log(result);
  // });
});
