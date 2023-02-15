import { ENV } from '../../app.config';

const { ETH_RPC_URL, WATCH_CHAIN_ADDRESS } = ENV;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');
const web3 = new Web3(ETH_RPC_URL);

describe('WEB3  TEST', () => {
  test('adapt()', async () => {
    const eventOptions = {
      address: WATCH_CHAIN_ADDRESS,
      fromBlock: 16674828,
      toBlock: 16674838,
      topics: [],
      // pagination: Number(REQ_PAGINATION) || 30, // 200?
    };
    const eventsArray = await web3.eth.getPastLogs(eventOptions);

    console.log(eventsArray);
  });
});
