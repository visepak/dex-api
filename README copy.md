# WatchChainBackEnd

# Install Redis
1. `sudo apt update`
2. `sudo apt install redis`
3. `sudo systemctl start redis-server`
4. Add your `REDIS_HOST` and `REDIS_PORT` variables to environment. Default values - `localhost`, `6379`

Applications uses Redis for:
- managing notifications queues. Tasks for sending notifications put in the relevant queue and getting from there by consumer
- periodical checking orders.

# Install MongoDB
1. `curl -fsSL https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -`
2. `echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list`
3. `sudo apt update`
4. `sudo apt install mongodb-org`
5. `sudo systemctl start mongod.service`
6. `sudo systemctl enable mongod`
7. Check status `mongo --eval 'db.runCommand({ connectionStatus: 1 })'`
8. Add your `DB_URI` variable to environment.

# Environment variables
- `PORT` - application listening port. For example, 3001
- `ENV` - environment where application will be run. `dev` for development
- `NETWORK` - current network, `testnet` or `mainnet`

- `DB_URI` - URI for connection to MongoDB instance. For example, `mongodb://root:root@localhost:27017`

- `USDC_ADDRESS_MAINNET` - USDC contract address for mainnet
- `USDC_ADDRESS_TESTNET` - USDC contract address for testnet

- `WATCH_CHAIN_ADDRESS_MAINNET` - WatchChain contract address for mainnet
- `WATCH_CHAIN_ADDRESS_TESTNET` - WatchChain contract address for testnet

- `WATCH_1155_ADDRESS_MAINNET` - contract address for ERC-1155 tokens on the mainnet
- `WATCH_1155_ADDRESS_TESTNET` - contract address for ERC-1155 tokens on the testnet

- `WATCH_721_ADDRESS_MAINNET` - contract address for ERC-721 tokens on the mainnet
- `WATCH_721_ADDRESS_TESTNET` - contract address for ERC-721 tokens on the testnet

- `MULTICALL_ADDRESS_MAINNET` - contract address for multicalls on the mainnet
- `MULTICALL_ADDRESS_TESTNET` - contract address for multicalls on the testnet

- `ETH_MAINNET_RPC_URL` - rpc url for mainnet (infura, or other prc provider)
- `ETH_TESTNET_RPC_URL` - rpc url for testnet (infura, or other prc provider)

- `START_BLOCK_MAINNET` - block which will be the first for handling mainnet events. For example, 12000000
- `START_BLOCK_TESTNET` - block which will be the first for handling testnet events. For example, 12623643

- `EVENT_REQ_PAGINATION` - number of blocks for requesting events. For example, 3000.

- `EMAIL_PROVIDER_DOMAIN` - url email provider domain. For example, `wcn-info.publicvm.com`
- `EMAIL_PROVIDER_API_KEY` - api key for email provider

- `BOT_TOKEN` - token for telegram bot. You can create a new telegram bot using bot @BotFather
- `BOT_NAME` - name of created telegram bot
- `TG_EVENT_CHANNEL` - channel for sending notifications

- `RATE_LIMITS_COMMON_TTL` - period for rate limiting in seconds for all routes. For example, 1 - for 1 second
- `RATE_LIMITS_COMMON_LIMIT` - number of request allowed for `TTL` period for all routes

- `RATE_LIMITS_WATCHES_TTL` - period for rate limiting in seconds for watch routes. For example, 1 - for 1 second
- `RATE_LIMITS_WATCHES_LIMIT` - number of request allowed for `TTL` period for watch routes

- `REDIS_HOST` - URI to redis instance. For example, `localhost`
- `REDIS_PORT` - port of redis instance

*Make sure that contract adddresses are the same for frontend part.*

# Swagger
Available on `%APPLICATION_URL%/swagger/#/`. For example, `http://localhost:3001/swagger/#/`