import { OrderState } from '../../order/order.schema';
import { BCProvider } from './bc-provider';

describe('BCProvider test', () => {
  const provider = new BCProvider();

  test('getLastBlock()', async () => {
    const result = await provider.getLastBlock();
    console.log(result);
  });

  test('getContractInfo()', async () => {
    const result = await provider.getContractInfo();
    console.log(result);
  });

  test('getEvents()', async () => {
    const result = await provider.getWcnEvents({
      fromBlock: 12291439,
      toBlock: 12291441,
    });
    console.log(typeof result);
  });

  test('checkOrder()', async () => {
    const order = {
      salt: '575183533174',
      orderType: '0',
      watchId: '0',
      maker: '0xf001df6c690cbb6779c18e93bb23581f368089c9',
      taker: '0x0000000000000000000000000000000000000000',
      shares: '100',
      price: '1000000',
      expiration: '1658836343',
    };
    const signature =
      '0x9ff4903f2cbe26d648d2ca653c593c33f5184dc788e1d83da05d697a386bb92f07994644bf40287a92210ce2b764747e88f714691ef5df74a835a5fcea1efff61b';
    const shares = '100';
    const result = await provider.checkOrder(order, signature, shares);
    console.log(result);
  });

  test('checkOrders()', async () => {
    const ordersFromDb = [
      {
        orderType: 0,
        price: 1,
        state: 'ACTIVE',
        orderError: 0,
        expiration: 1658836343,
        orderHash:
          '0x9e7dd789556b8200e138fabaaaa28f627d65c605adc628c91c7ffe98f94a9a5e',
        maker: '0xf001df6c690cbb6779c18e93bb23581f368089c9',
        makerUsername: null,
        taker: '0x0000000000000000000000000000000000000000',
        signature:
          '0x9ff4903f2cbe26d648d2ca653c593c33f5184dc788e1d83da05d697a386bb92f07994644bf40287a92210ce2b764747e88f714691ef5df74a835a5fcea1efff61b',
        shares: 100,
        remainingShares: 100,
        remainingSharesEvent: 100,
        watchId: '0',
        orderData: {
          salt: '575183533174',
          orderType: '0',
          watchId: '0',
          maker: '0xf001df6c690cbb6779c18e93bb23581f368089c9',
          taker: '0x0000000000000000000000000000000000000000',
          shares: '100',
          price: '1000000',
          expiration: '1658836343',
        },
      },
    ];
    const orders = ordersFromDb.map((order) => {
      return {
        ...order,
        state: OrderState[order.state],
      };
    });
    const result = await provider.checkOrders(orders);
    console.log(result);
  });
});
