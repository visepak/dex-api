import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderState,
  OrderType,
} from '../../order/order.schema';
import { BCProvider } from '../provider/bc-provider';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { OrdersCache } from '../../order/interface/order-cache.interface';

@Injectable()
export class OrdersCheckerService {
  private readonly logger = new Logger(OrdersCheckerService.name);
  private readonly bcprovider = new BCProvider();

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectQueue('create-order') private createOrderQueue: Queue,
  ) {}

  async checkActiveOrders() {
    const activeOrders = await this.getActiveOrders();
    if (activeOrders.length <= 0) {
      return;
    }
    const checkedOrders = await this.bcprovider.checkOrders(activeOrders);
    for (const order of checkedOrders) {
      if (order.orderError > 0) {
        // await this.orderModel.remove({ orderHash: order.orderHash });
        await this.orderModel.updateOne(
          { orderHash: order.orderHash },
          {
            orderError: order.orderError,
            state: order.state,
            orderCheckData: order.orderCheckData,
          },
        );
      }
    }
  }

  async checkCreatedOrders() {
    const { createdOrders, jobs } = await this.getCreatedOrdersFromQueue();
    if (createdOrders.length <= 0) {
      return;
    }
    const checkedOrders = await this.bcprovider.checkOrders(createdOrders);
    const goodCreatedOrders = checkedOrders.filter(
      (item) => item.orderError === 0,
    );
    await this.removeCreatedOrdersFromQueue(jobs);
    if (goodCreatedOrders.length > 0) {
      await this.orderModel.create(goodCreatedOrders);
    }
  }

  private async getActiveOrders(): Promise<Order[]> {
    const orders = await this.orderModel
      .find({
        state: OrderState.ACTIVE,
      })
      .exec();
    return orders;
  }

  async addCreateOrder(order: Order) {
    await this.createOrderQueue.add({
      ...order,
    });
  }

  async getCreatedOrdersFromQueue(): Promise<{
    jobs: Job[];
    createdOrders: Order[];
  }> {
    const jobs = await this.createOrderQueue.getWaiting();
    return { jobs, createdOrders: jobs.map((job) => job.data) };
  }

  async getCreatedOrdersByWatchId(watchId: string): Promise<OrdersCache> {
    const { createdOrders } = await this.getCreatedOrdersFromQueue();
    const createdOrderCache = createdOrders.reduce(
      (acc, val) => {
        if (val.watchId === watchId) {
          val.orderType === OrderType.BuyLimit
            ? acc.buy.push(val)
            : acc.sell.push(val);
        }
        return acc;
      },
      {
        sell: [],
        buy: [],
      } as OrdersCache,
    );
    return createdOrderCache;
  }

  private async removeCreatedOrdersFromQueue(jobs: Job[]) {
    if (jobs.length > 0) {
      const promises: Array<Promise<any>> = [];
      for (const job of jobs) {
        promises.push(
          (async () => {
            await job.remove();
          })(),
        );
      }
      await Promise.all(promises);
    }
  }
}
