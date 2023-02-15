import { fromNativeToNumberUSDC } from '../../../utils/decimalsConverter';
import { WatchStatus } from '../../../watch/watch.schema';

const priceHr = fromNativeToNumberUSDC('55000');

export const WatchStub = {
  watchId: '0',
  ref: '0xad17da54306427f758b1a87e1fe9b4121a73b4de1584a9237a96382e83f2717d',
  startTime: Date.now(),
  initialPrice: priceHr,
  currentPrice: priceHr,
  currentSharePrice: 1,
  previousSharePrice: 1,
  shares: priceHr,
  status: WatchStatus.Presale,
  prices24: [
    {
      timestamp: Date.now(),
      price: 1.0,
    },
  ],
  quarterChart: [
    {
      timestamp: new Date().toISOString().split('T')[0],
      value: priceHr.toString(),
    },
  ],
};
