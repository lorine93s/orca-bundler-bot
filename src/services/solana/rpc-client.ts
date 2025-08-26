import { Connection, Commitment, PublicKey } from '@solana/web3.js';
import { logger } from '../../utils/logger';
import { config } from '../../config';

export class RpcClient {
  private connection: Connection;
  private readonly commitment: Commitment = 'confirmed';

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, {
      commitment: this.commitment,
      wsEndpoint: config.solana.wsEndpoint,
    });
    logger.info(`Connected to Solana ${config.solana.network} via ${config.solana.rpcUrl}`);
  }

  getConnection(): Connection {
    return this.connection;
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey, this.commitment);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      logger.error(`Error getting balance for ${publicKey.toBase58()}: ${error}`);
      throw error;
    }
  }

  async getRecentPrioritizationFees(): Promise<number> {
    try {
      const fees = await this.connection.getRecentPrioritizationFees();
      if (fees.length === 0) return 0;
      
      // Calculate average prioritization fee
      const total = fees.reduce((sum, fee) => sum + fee.prioritizationFee, 0);
      return total / fees.length;
    } catch (error) {
      logger.warn(`Error getting recent prioritization fees: ${error}`);
      return 0;
    }
  }

  async getSlot(): Promise<number> {
    return await this.connection.getSlot();
  }

  async getTransaction(signature: string) {
    return await this.connection.getTransaction(signature);
  }

  // Add retry logic for reliable RPC calls
  async withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Attempt ${attempt} failed: ${error}`);
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw lastError!;
  }
}

export const rpcClient = new RpcClient();
export default rpcClient;