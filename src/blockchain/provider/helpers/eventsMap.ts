import * as wcnAbi from '../abi/watchchain.json';
import { ENV } from '../../../app.config';

const { WATCH_CHAIN_ADDRESS } = ENV;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');
const web3 = new Web3();

// OwnershipTransferred data in topic[1], topic[2]. We support data only in event.data
const WCN_EXCLUDED_EVENTS = ['OwnershipTransferred', 'SwapSharesToQuoteToken'];

function abiEventToMap(abi, excludedEvents: string[]) {
  return abi
    .filter((el) => el.type === 'event' && !excludedEvents.includes(el.name))
    .reduce((acc, event) => {
      const signature = web3.eth.abi.encodeEventSignature(event);
      return { ...acc, [signature]: event };
    }, {});
}

export const eventsMap = {
  [WATCH_CHAIN_ADDRESS]: abiEventToMap(wcnAbi, WCN_EXCLUDED_EVENTS),
};
