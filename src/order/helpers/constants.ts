export const PROTOCOL_NAME = 'Watch Chain Limit Order';

export const PROTOCOL_VERSION = '1';

export const ZX = '0x';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const EIP712_DOMAIN = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

export const ORDER_STRUCTURE = [
  { name: 'salt', type: 'uint256' },
  { name: 'orderType', type: 'uint8' },
  { name: 'watchId', type: 'uint256' },
  { name: 'maker', type: 'address' },
  { name: 'taker', type: 'address' },
  { name: 'shares', type: 'uint256' },
  { name: 'price', type: 'uint256' },
  { name: 'expiration', type: 'uint256' },
];
