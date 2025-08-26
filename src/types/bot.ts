import { PublicKey, Transaction } from '@solana/web3.js';
import { Quote } from './orca';

export interface BotConfig {
  solana: {
    rpcUrl: string;
    network: string;
    wsEndpoint: string;
  };
  wallet: {
    privateKey: string;
  };
  trading: {
    defaultSlippage: number;
    maxSlippage: number;
    minProfitThreshold: number;
    maxTradeSize: number;
  };
  transaction: {
    priorityFeeMultiplier: number;
    confirmationTimeout: number;
  };
  bot: {
    scanInterval: number;
    maxBundleSize: number;
  };
}

export interface TradeOpportunity {
  poolAddress: PublicKey;
  inputToken: PublicKey;
  outputToken: PublicKey;
  inputAmount: number;
  expectedOutputAmount: number;
  minOutputAmount: number; // Considering slippage
  quote: Quote;
  estimatedProfit: number; // In SOL or USD
  timestamp: number;
}

export interface Bundle {
  transactions: Transaction[];
  opportunities: TradeOpportunity[];
  totalEstimatedProfit: number;
  createdAt: number;
}

export interface ExecutionResult {
  success: boolean;
  signature?: string;
  error?: string;
  opportunities: TradeOpportunity[];
  profit?: number;
  timestamp: number;
}

export interface MonitoringMetrics {
  totalBundlesExecuted: number;
  successfulBundles: number;
  failedBundles: number;
  totalProfit: number;
  averageProfitPerBundle: number;
  lastExecutionTime: number;
  uptime: number;
}