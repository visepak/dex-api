import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection, Model } from 'mongoose';

import { ChartController } from './chart.controller';

import { ChartService } from './chart.service';

import { Watch, WatchSchema } from '../watch/watch.schema';
import { Chart, ChartSchema } from './chart.schema';

describe('ChartController', () => {
  let module: TestingModule;
  let controller: ChartController;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

  let chartModel: Model<Chart>;
  let watchModel: Model<Watch>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    chartModel = mongoConnection.model(Chart.name, ChartSchema);
    watchModel = mongoConnection.model(Watch.name, WatchSchema);

    module = await Test.createTestingModule({
      controllers: [ChartController],
      providers: [
        ChartService,
        { provide: getModelToken(Chart.name), useValue: chartModel },
        { provide: getModelToken(Watch.name), useValue: watchModel },
      ],
    }).compile();

    controller = module.get<ChartController>(ChartController);
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();

    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
