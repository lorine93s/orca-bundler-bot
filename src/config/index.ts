import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Environment variables schema
const envVarsSchema = Joi.object({
  RPC_URL: Joi.string().uri().required(),
  NETWORK: Joi.string().valid('mainnet-beta', 'testnet', 'devnet').required(),
  WS_ENDPOINT: Joi.string().uri().optional(),
  WALLET_PRIVATE_KEY: Joi.string().required(),
  DEFAULT_SLIPPAGE: Joi.number().min(0).max(10).default(0.5),
  MAX_SLIPPAGE: Joi.number().min(0).max(20).default(2.0),
  MIN_PROFIT_THRESHOLD: Joi.number().min(0).default(0.001),
  MAX_TRADE_SIZE: Joi.number().min(0).default(10),
  PRIORITY_FEE_MULTIPLIER: Joi.number().min(1).default(1.5),
  CONFIRMATION_TIMEOUT: Joi.number().min(1000).default(30000),
  SCAN_INTERVAL: Joi.number().min(100).default(5000),
  MAX_BUNDLE_SIZE: Joi.number().min(1).max(10).default(5),
  HELIUS_API_KEY: Joi.string().optional(),
  BIRDEYE_API_KEY: Joi.string().optional(),
  TELEGRAM_BOT_TOKEN: Joi.string().optional(),
  TELEGRAM_CHAT_ID: Joi.string().optional(),
}).unknown();

const { value: envVars, error } = envVarsSchema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Load settings from JSON file
const settingsPath = path.join(__dirname, '../../settings.json');
let settings = {};
if (fs.existsSync(settingsPath)) {
  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

export const config = {
  solana: {
    rpcUrl: envVars.RPC_URL,
    network: envVars.NETWORK,
    wsEndpoint: envVars.WS_ENDPOINT || envVars.RPC_URL.replace('https', 'wss'),
  },
  wallet: {
    privateKey: envVars.WALLET_PRIVATE_KEY,
  },
  trading: {
    defaultSlippage: envVars.DEFAULT_SLIPPAGE,
    maxSlippage: envVars.MAX_SLIPPAGE,
    minProfitThreshold: envVars.MIN_PROFIT_THRESHOLD,
    maxTradeSize: envVars.MAX_TRADE_SIZE,
  },
  transaction: {
    priorityFeeMultiplier: envVars.PRIORITY_FEE_MULTIPLIER,
    confirmationTimeout: envVars.CONFIRMATION_TIMEOUT,
  },
  bot: {
    scanInterval: envVars.SCAN_INTERVAL,
    maxBundleSize: envVars.MAX_BUNDLE_SIZE,
  },
  api: {
    helius: envVars.HELIUS_API_KEY,
    birdeye: envVars.BIRDEYE_API_KEY,
  },
  monitoring: {
    telegramBotToken: envVars.TELEGRAM_BOT_TOKEN,
    telegramChatId: envVars.TELEGRAM_CHAT_ID,
  },
  settings,
};

export default config;