import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TelegrafModule } from 'nestjs-telegraf';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection, Model } from 'mongoose';

import { EmailService } from '../email.service';
import { TelegramService } from '../telegram.service';
import { UserService } from '../user.service';

import { User, UserSchema } from '../user.schema';

import { ENV } from '../../app.config';

describe('UsersService', () => {
  let service: UserService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

  let userModel: Model<User>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    userModel = mongoConnection.model(User.name, UserSchema);

    const module: TestingModule = await Test.createTestingModule({
      imports: [TelegrafModule.forRoot({ token: ENV.TG_BOT_TOKEN })],
      providers: [
        UserService,
        EmailService,
        TelegramService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
