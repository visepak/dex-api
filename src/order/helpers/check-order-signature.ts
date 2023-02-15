import { ethers } from 'ethers';
import { ORDER_STRUCTURE, PROTOCOL_NAME, PROTOCOL_VERSION } from './constants';
import { EIP712TypedData, LimitOrder } from './types';
import { ENV } from '../../app.config';
const { CHAIN_ID, WATCH_CHAIN_ADDRESS } = ENV;

export const checkOrderSignature = (orderData, signature) => {
  const typedData = buildLimitOrderTypedData(orderData);
  const recoveredAddress = ethers.utils.verifyTypedData(
    typedData.domain,
    typedData.types,
    typedData.message,
    signature,
  );
  return orderData.maker.toLowerCase() === recoveredAddress.toLowerCase();
};
//
// const limitOrder = {
//   salt: '719885344757',
//   orderType: '1',
//   watchId: '0',
//   maker: '0x99d7eedec6a43b398ab7e95817a5f48afcf4c6bf',
//   taker: '0x0000000000000000000000000000000000000000',
//   shares: '100',
//   price: '2000000',
//   expiration: '1658920206',
// };
//
// const signature =
//   '0xfe357199cc6d464423af13a0671366da2db99d7c2a193c5fdcf11251f6c17f027a13c65bd6e1e6d0ef1ebcb78c6819d75935c1e42d744a16d5c884fa881304031b';
//
// const result = checkOrderSignature(limitOrder, signature);
// console.log({ result });

function buildLimitOrderTypedData(order: LimitOrder): EIP712TypedData {
  return {
    primaryType: 'Order',
    types: {
      Order: ORDER_STRUCTURE,
    },
    domain: {
      name: PROTOCOL_NAME,
      version: PROTOCOL_VERSION,
      chainId: CHAIN_ID,
      verifyingContract: WATCH_CHAIN_ADDRESS,
    },
    message: order,
  };
}
