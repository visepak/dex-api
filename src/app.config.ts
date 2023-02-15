import * as Joi from 'joi';
import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';

config({ path: `.env` });

const JWT_PUBLIC_KEY_path = path.resolve('./keys/jwtRS256.key.pub');
const JWT_PUBLIC_KEY = fs.readFileSync(JWT_PUBLIC_KEY_path, 'utf8');

const schema = Joi.object({
  PORT: Joi.number().default(3001),
  WCN_DB_DBNAME: Joi.string().required(),
  WCN_DB_HOST: Joi.string().default('localhost'),
  WCN_DB_PORT: Joi.number().default(27017),
  WCN_DB_USERNAME: Joi.string().required(),
  WCN_DB_PASSWORD: Joi.string().required(),
  EVENT_REQ_PAGINATION: Joi.number().default(5000),

  JWT_PUBLIC_KEY: Joi.string().required(),
  ETH_RPC_URL: Joi.string().required(),
  CHAIN_ID: Joi.number().required(),
  WATCH_CHAIN_ADDRESS: Joi.string().required(),
  MULTICALL_ADDRESS: Joi.string().required(),
  START_BLOCK: Joi.number().required(),

  TG_BOT_TOKEN: Joi.string().required(),
  TG_BOT_NAME: Joi.string().required(),
  TG_EVENT_CHANNEL: Joi.string().required(),

  EMAIL_PROVIDER_DOMAIN: Joi.string().required(),
  EMAIL_PROVIDER_API_KEY: Joi.string().required(),
  // EMAIL_PROVIDER_API_URL: Joi.string().required(),

  WCN_LINK: Joi.string().required(),

  RATE_LIMITS_COMMON_TTL: Joi.number().default(1), // 1
  RATE_LIMITS_COMMON_LIMIT: Joi.number().default(5), // 5
  RATE_LIMITS_WATCHES_TTL: Joi.number().default(1), // 1
  RATE_LIMITS_WATCHES_LIMIT: Joi.number().default(50), // 50

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  SENTRY_DSN: Joi.string().required(),

  CMS_URL: Joi.string().required(),

  RESCAN_ALL_AVGSHAREPRICE: Joi.boolean().default(false),
});

const rawENV = {
  JWT_PUBLIC_KEY,
  PORT: process.env.PORT,
  WCN_DB_USERNAME: process.env.WCN_DB_USERNAME,
  WCN_DB_HOST: process.env.WCN_DB_HOST,
  WCN_DB_PORT: process.env.WCN_DB_PORT,
  WCN_DB_PASSWORD: process.env.WCN_DB_PASSWORD,
  WCN_DB_DBNAME: process.env.WCN_DB_DBNAME,
  EVENT_REQ_PAGINATION: process.env.EVENT_REQ_PAGINATION,
  ETH_RPC_URL: process.env.ETH_RPC_URL,
  CHAIN_ID: process.env.CHAIN_ID,
  WATCH_CHAIN_ADDRESS: process.env.WATCH_CHAIN_ADDRESS,
  MULTICALL_ADDRESS: process.env.MULTICALL_ADDRESS,
  START_BLOCK: process.env.START_BLOCK,
  TG_BOT_TOKEN: process.env.TG_BOT_TOKEN,
  TG_BOT_NAME: process.env.TG_BOT_NAME,
  TG_EVENT_CHANNEL: process.env.TG_EVENT_CHANNEL,
  EMAIL_PROVIDER_DOMAIN: process.env.EMAIL_PROVIDER_DOMAIN,
  EMAIL_PROVIDER_API_KEY: process.env.EMAIL_PROVIDER_API_KEY,
  // EMAIL_PROVIDER_API_URL: process.env.EMAIL_PROVIDER_API_URL,
  WCN_LINK: process.env.WCN_LINK,
  RATE_LIMITS_COMMON_TTL: process.env.RATE_LIMITS_COMMON_TTL,
  RATE_LIMITS_COMMON_LIMIT: process.env.RATE_LIMITS_COMMON_LIMIT,
  RATE_LIMITS_WATCHES_TTL: process.env.RATE_LIMITS_WATCHES_TTL,
  RATE_LIMITS_WATCHES_LIMIT: process.env.RATE_LIMITS_WATCHES_LIMIT,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  SENTRY_DSN: process.env.SENTRY_DSN,
  CMS_URL: process.env.CMS_URL,
  RESCAN_ALL_AVGSHAREPRICE: process.env.RESCAN_ALL_AVGSHAREPRICE,
};

const validatedEnvs = schema.validate(rawENV);
if (!!validatedEnvs.error) {
  throw new Error(`.env validation error: ${validatedEnvs.error.message}`);
}
export const ENV = validatedEnvs.value;

export const DB_URI = `mongodb://${ENV.WCN_DB_USERNAME}:${ENV.WCN_DB_PASSWORD}@${ENV.WCN_DB_HOST}:${ENV.WCN_DB_PORT}`;
export const DB_OPTS = { dbName: ENV.WCN_DB_DBNAME };

export const REDIS = {
  host: ENV.REDIS_HOST,
  port: +ENV.REDIS_PORT,
};
export const API_V1 = '/api/v1';
export const USDC_DECIMALS = 6;

export const TG_NOTIFICATION_JOB = 'tg-notification';
export const EMAIL_NOTIFICATION_JOB = 'email-notification';

export const RATE_LIMITS = {
  COMMON: {
    ttl: +ENV.RATE_LIMITS_COMMON_TTL,
    limit: +ENV.RATE_LIMITS_COMMON_LIMIT,
  },
  WATCHES: {
    ttl: +ENV.RATE_LIMITS_WATCHES_TTL,
    limit: +ENV.RATE_LIMITS_WATCHES_LIMIT,
  },
};

// export const PUB_KEY = `-----BEGIN PUBLIC KEY-----
//   MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEou4Kfc3fQiPtd6lkZ7sWC/EkK38E
// 7KnWsaDMLqNvB8A2AguXvWpY1/utKkFAXAwotqrONaWTR/0mMnIb6G002A==
// -----END PUBLIC KEY-----`;

export const PUB_KEY = `-----BEGIN PUBLIC KEY-----
  MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAzSdQV5E03LvBqdxrmwBl
f1mJ4ZPQN9W6ftBDqOytlRhspDGbmwyAbKUXm4pBYEGO3fL6HXpbJe9KByPmJewJ
jRsQiMIikJWP1xqyX6uCMISe4CgHDVToZFAM60msygsywvvMSh5z/MkBSQkhiHBq
fOfjIQml7EQSQm6GcebU0I/C2kbo2e8grgjIQ1bd4rDnM+gEptq6r09RzTEMdrdf
/MZ7qHG8gAPD27W19RAQ6XrgtfDZkn49x5xsROwtGsDEnb2C7oyuvQy3/3E71Sef
U6n0haLKpwrQWtkOnIY8UFoWrTv9vW4mM0NTRg5FkOYKOZv0QWaAPTOa9wE42Q2L
3KS88C0ewPNTC5jA7A7T63fw1hxU0FHYy3+u7AppBb4Cu2FzJaaQ2jQqRlX2TE85
ZjnZi0dQaVIq/u62ru0csz3387jWaSzGVEzxDS6LEbuuFawzYPvPkZH4fK5eejbI
oQKNbAlL1iyB1c5INCgeEhE0VQ+uyF7Dbw81kf4YoRNFEMxw3pk+wLFIc2y04wwL
1qnizbGP3mkSGQMkm7R8ZClsc0lO41Asvp5iYecXSLAm2frLgSSUw81EzWfhFv6/
ZN5JFAecIMEe6UurqJ+x/CvFbmLBTa0lLNdhKctqEfz1GBPxmmIU8SYkqj7Ej7w4
yUgWJteRnUG4FwX4U/BUu2kCAwEAAQ==
-----END PUBLIC KEY-----`;
