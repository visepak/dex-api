// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');

export const convertToWei = (value: string): string => {
  return Web3.utils.toWei(value, 'Mwei');
};
export const convertFromWei = (value: string): string => {
  return Web3.utils.fromWei(value, 'Mwei');
};
