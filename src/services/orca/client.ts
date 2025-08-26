import { OrcaFactory, Orca, Network, OrcaPool } from '@orca-so/sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from '../../utils/logger';
import { rpcClient } from '../solana/rpc-client';
import { config } from '../../config';

export class OrcaClient {
  private orca: Orca;
  private connection: Connection;
  private pools: Map<string, OrcaPool> = new Map();

  constructor() {
    this.connection = rpcClient.getConnection();
    const network = config.solana.network as Network;
    this.orca = OrcaFactory.getOrca(this.connection, network);
    logger.info(`Initialized Orca client for ${network}`);
  }

  getOrcaInstance(): Orca {
    return this.orca;
  }

  async getPool(poolAddress: string | PublicKey): Promise<OrcaPool> {
    const address = typeof poolAddress === 'string' ? poolAddress : poolAddress.toBase58();
    
    if (this.pools.has(address)) {
      return this.pools.get(address)!;
    }

    try {
      const pool = await this.orca.getPool(new PublicKey(address));
      this.pools.set(address, pool);
      return pool;
    } catch (error) {
      logger.error(`Error getting pool ${address}: ${error}`);
      throw error;
    }
  }

  async getToken(tokenSymbol: string) {
    try {
      return this.orca.getToken(tokenSymbol);
    } catch (error) {
      logger.error(`Error getting token ${tokenSymbol}: ${error}`);
      throw error;
    }
  }

  async refreshPoolData(poolAddress: string | PublicKey): Promise<OrcaPool> {
    const address = typeof poolAddress === 'string' ? poolAddress : poolAddress.toBase58();
    this.pools.delete(address);
    return this.getPool(address);
  }

  async getAllPools(): Promise<OrcaPool[]> {
    try {
      // This might need to be customized based on available pools
      const poolAddresses = [
        // Add popular pool addresses here
      ];
      
      const pools: OrcaPool[] = [];
      for (const address of poolAddresses) {
        try {
          const pool = await this.getPool(address);
          pools.push(pool);
        } catch (error) {
          logger.warn(`Could not load pool ${address}: ${error}`);
        }
      }
      
      return pools;
    } catch (error) {
      logger.error(`Error getting all pools: ${error}`);
      throw error;
    }
  }
}

export const orcaClient = new OrcaClient();
export default orcaClient;