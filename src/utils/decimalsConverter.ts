import BigNumber from 'bignumber.js';
import { USDC_DECIMALS } from '../app.config';

export function fromNativeToNumberUSDC(value: string | number): number {
  return new BigNumber(value).shiftedBy(-USDC_DECIMALS).toNumber();
}

export function toNativeToStringUSDC(value: string | number): string {
  return new BigNumber(value).shiftedBy(USDC_DECIMALS).toString();
}

export function ceilDiv(val, by) {
  return (val - (val % by)) / by;
}
