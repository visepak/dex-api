import { ENV } from '../../app.config';
import { eventsMap } from './helpers/eventsMap';
import * as wcnAbi from './abi/watchchain.json';
import * as MultiCallAbi from './abi/Multicall.json';
import { GetWcnEventsRequest, GetWcnEventsRes } from './interface/event-types';
import { Order, OrderError } from '../../order/order.schema';
import { AbiItem } from 'web3-utils';
import { Interface } from '@ethersproject/abi';
import { getOrderStateFromOrderError } from '../../order/helpers/convertOrder';
import { Call } from './interface/multicall.interface';
import { Logger } from '@nestjs/common';

const { ETH_RPC_URL, MULTICALL_ADDRESS, WATCH_CHAIN_ADDRESS } = ENV;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');
const web3 = new Web3(ETH_RPC_URL);

// Add methods for different contracts
// export const watchChain = new web3.eth.Contract(watchchainAbi, WATCH_CHAIN_ADDRESS);
// export const watch1155 = new web3.eth.Contract(watch1155Abi, WATCH_1155_ADDRESS);
// export const usdt = new web3.eth.Contract(ABI, USDT_ADDRESS);

export class BCProvider {
  private readonly logger = new Logger(BCProvider.name);

  async getLastBlock() {
    return await web3.eth.getBlockNumber();
  }

  async getContractInfo() {
    const contract = new web3.eth.Contract(wcnAbi, WATCH_CHAIN_ADDRESS);
    const result = await contract.methods;
    return result;
    // const pastEvents = await contract
    //   .getPastEvents('allEvents')
    //   .then(console.log);
    // return pastEvents;
  }

  async checkOrder(order, signature, shares): Promise<OrderError> {
    const contract = new web3.eth.Contract(wcnAbi, WATCH_CHAIN_ADDRESS);
    const result = await contract.methods
      .checkOrderError(order, signature, shares)
      .call();
    return +result;
  }

  async getWcnEvents(req: GetWcnEventsRequest): Promise<GetWcnEventsRes[]> {
    const pastLogs = await web3.eth.getPastLogs({
      address: WATCH_CHAIN_ADDRESS,
      topics: [],
      ...req,
    });
    const events: GetWcnEventsRes[] = pastLogs
      .filter(
        (event) =>
          event.blockNumber > 0 &&
          eventsMap[WATCH_CHAIN_ADDRESS][event.topics[0]] != undefined &&
          !event.removed,
      )
      .map((event) => {
        const eventAbi = eventsMap[WATCH_CHAIN_ADDRESS][event.topics[0]];
        const decodedData = web3.eth.abi.decodeParameters(
          eventAbi.inputs,
          event.data,
        );
        const result = {
          blockNumber: event.blockNumber,
          logIndex: event.logIndex,
          address: event.address,
          type: eventAbi.name,
          data: { ...decodedData },
          transactionHash: event.transactionHash,
          log: event,
        };
        return result;
      });
    return events;
  }

  async checkOrders(orders: Order[]): Promise<Order[]> {
    // TODO: add batch requests by 200 (or more) orders
    const calls = orders.map((order) => {
      return {
        address: WATCH_CHAIN_ADDRESS,
        name: 'checkOrderError',
        params: [order.orderData, order.signature, order.remainingShares],
      };
    });
    try {
      const reply = await this.multicallWcn(calls);
      const result = orders.map((order, index) => {
        const orderErrorNumber = reply.orderErrors[index][0];
        if (orderErrorNumber > 0) {
          order.orderError = orderErrorNumber;
          order.state = getOrderStateFromOrderError(orderErrorNumber);
          order.orderCheckData = { res: reply.orderCheckData, req: calls };
        }
        return order;
      });
      return result;
    } catch (e) {
      this.logger.error(e);
    }
  }

  async multicallWcn(calls: Call[]) {
    const multi = new web3.eth.Contract(
      MultiCallAbi as unknown as AbiItem,
      MULTICALL_ADDRESS,
    );
    const calldata = calls.map((call) => {
      const itf = new Interface(wcnAbi);
      return [
        call.address.toLowerCase(),
        itf.encodeFunctionData(call.name, call.params),
      ];
    });
    const data = await multi.methods.multicall(calldata).call();

    const res = data.map((call, i) => {
      const itf = new Interface(wcnAbi);
      return itf.decodeFunctionResult(calls[i].name, call);
    });
    return { orderErrors: res, orderCheckData: data };
  }
}
