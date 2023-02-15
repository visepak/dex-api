import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection, Model } from 'mongoose';
import { TelegrafModule } from 'nestjs-telegraf';

import { TelegramService } from '../telegram.service';

import { User, UserSchema } from '../user.schema';

import { ENV } from '../../app.config';

describe('TelegramService', () => {
  let module: TestingModule;
  let service: TelegramService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

  let userModel: Model<User>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    userModel = mongoConnection.model(User.name, UserSchema);

    module = await Test.createTestingModule({
      imports: [TelegrafModule.forRoot({ token: ENV.TG_BOT_TOKEN })],
      providers: [
        TelegramService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
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

  // it('sendTest', async () => {
  //   await service.sendTest();
  // }, 60000);
});
