import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection, Model } from 'mongoose';
import { Share, ShareSchema } from './share.schema';
import { ShareService } from './share.service';
import { WcnEventsTypes } from '../blockchain/provider/interface/event-types';
import { OrderState } from '../order/order.schema';
import { convertOrderFilledEvent } from '../blockchain/event/event-converter';

describe('ShareService', () => {
  let service: ShareService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let shareModel: Model<Share>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    mongoConnection = (await connect(uri)).connection;

    shareModel = mongoConnection.model(Share.name, ShareSchema);

    const app: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        ShareService,
        { provide: getModelToken(Share.name), useValue: shareModel },
      ],
    }).compile();

    service = app.get<ShareService>(ShareService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('subShareTest', () => {
    const oldShare = { price: 0.195588, amount: 3400 };
    const newShare = { shares: 1000, quoteTokenAmount: 1200 };
    const result = service.subShare(oldShare, newShare);
    console.log(result);
  });

  it('handleOrderFilledEvent', async () => {
    const initShare = new shareModel({
      address: '0x99d7eedec6a43b398ab7e95817a5f48afcf4c6bf',
      watchId: '21',
      amount: 27100,
      price: 1,
    });
    await initShare.save();

    const event = {
      blockNumber: 8079900,
      logIndex: 34,
      address: '0xAcf902caA41ef8B2C0A1f92ab6645a36c512F3A0',
      type: WcnEventsTypes.OrderFilled,
      data: {
        '0': '0x6F70256F4F54e9E62E633872687921D96AFFbD71',
        '1': '200',
        '2': '0x7facc56cc3e52a58ee2b9c0c18a416619a7dce2b645f127bb29833bb2872b0d0',
        '3': '0',
        '4': '1670254356',
        __length__: 5,
        taker: '0x6F70256F4F54e9E62E633872687921D96AFFbD71',
        shares: '200',
        orderHash:
          '0x7facc56cc3e52a58ee2b9c0c18a416619a7dce2b645f127bb29833bb2872b0d0',
        remaining: '800',
        timestamp: '1670254356',
      },
      transactionHash:
        '0x5b4d5d293156d45d25467d9bb7af70573be026e2809411f33c85a53c7200f328',
      log: {
        address: '0xAcf902caA41ef8B2C0A1f92ab6645a36c512F3A0',
        blockHash:
          '0x7523d9ef93ac694600d62ddd6f507b5519630fb69ab0946ed0b47c5272901433',
        blockNumber: 8079900,
        data: '0x0000000000000000000000006f70256f4f54e9e62e633872687921d96affbd7100000000000000000000000000000000000000000000000000000000000000647facc56cc3e52a58ee2b9c0c18a416619a7dce2b645f127bb29833bb2872b0d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000638e0f14',
        logIndex: 34,
        removed: false,
        topics: [
          '0x0087bb14bd272d4e3c8405788cf301664435befa315de64d11f34a4781d37104',
        ],
        transactionHash:
          '0x5b4d5d293156d45d25467d9bb7af70573be026e2809411f33c85a53c7200f328',
        transactionIndex: 22,
        id: 'log_712b75cf',
      },
    };
    const order = {
      orderType: 1,
      price: 1,
      state: OrderState.FILLED,
      orderError: 3,
      expiration: 1670859074,
      orderHash:
        '0x7facc56cc3e52a58ee2b9c0c18a416619a7dce2b645f127bb29833bb2872b0d0',
      maker: '0x99d7eedec6a43b398ab7e95817a5f48afcf4c6bf',
      makerUsername: null,
      taker: '0x0000000000000000000000000000000000000000',
      signature:
        '0x374a55119cd250418e5ee793fac472fea4802dbded6869df79b4936004cd182828b5193aa7152e0021d51c45f62049a52a72ab9811baa467f284dd57d70af8641c',
      shares: 1000,
      remainingShares: 0,
      remainingSharesEvent: 0,
      watchId: '21',
      orderData: {
        salt: '1265648883065',
        orderType: '1',
        watchId: '21',
        maker: '0x99d7eedec6a43b398ab7e95817a5f48afcf4c6bf',
        taker: '0x0000000000000000000000000000000000000000',
        shares: '100',
        price: '1000000',
        expiration: '1670859074',
      },
      orderCheckData: {
        res: [
          '0x0000000000000000000000000000000000000000000000000000000000000003',
        ],
        req: [
          {
            address: '0xAcf902caA41ef8B2C0A1f92ab6645a36c512F3A0',
            name: 'checkOrderError',
            params: [
              {
                salt: '1265648883065',
                orderType: '1',
                watchId: '21',
                maker: '0x99d7eedec6a43b398ab7e95817a5f48afcf4c6bf',
                taker: '0x0000000000000000000000000000000000000000',
                shares: '100',
                price: '1000000',
                expiration: '1670859074',
              },
              '0x374a55119cd250418e5ee793fac472fea4802dbded6869df79b4936004cd182828b5193aa7152e0021d51c45f62049a52a72ab9811baa467f284dd57d70af8641c',
              0,
            ],
          },
        ],
      },
    };
    await service.handleOrderFilledEvent(
      convertOrderFilledEvent(event.data),
      order,
    );
    const allShares = await shareModel.find().exec();
    console.log({ allShares });
  });
});
