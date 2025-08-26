import { Connection, PublicKey, TransactionSignature } from '@solana/web3.js';
import { logger } from '../utils/logger';
import { rpcClient } from '../services/solana/rpc-client';
import { orcaClient } from '../services/orca/client';

export interface MempoolTransaction {
  signature: TransactionSignature;
  slot: number;
  // Add other relevant fields
}

export class MempoolListener {
  private connection: Connection;
  private subscriptionId: number | null = null;
  private orcaProgramIds: PublicKey[] = [];

  constructor() {
    this.connection = rpcClient.getConnection();
    this.initializeOrcaProgramIds();
  }

  private initializeOrcaProgramIds() {
    // Main Orca program IDs (update with actual IDs)
    this.orcaProgramIds = [
      new PublicKey('9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP'), // Orca main program
      // Add other Orca program IDs as needed
    ];
  }

  async startListening(callback: (tx: MempoolTransaction) => void): Promise<void> {
    try {
      logger.info('Starting mempool listener...');
      
      this.subscriptionId = this.connection.onLogs(
        'all',
        (logs, context) => {
          // Check if this log is from an Orca program
          if (this.isOrcaTransaction(logs.logs)) {
            const mempoolTx: MempoolTransaction = {
              signature: logs.signature,
              slot: context.slot,
            };
            callback(mempoolTx);
          }
        },
        'processed' // commitment level
      );
      
      logger.info('Mempool listener started successfully');
    } catch (error) {
      logger.error(`Error starting mempool listener: ${error}`);
      throw error;
    }
  }

  stopListening(): void {
    if (this.subscriptionId !== null) {
      this.connection.removeOnLogsListener(this.subscriptionId);
      this.subscriptionId = null;
      logger.info('Mempool listener stopped');
    }
  }

  private isOrcaTransaction(logs: string[]): boolean {
    for (const log of logs) {
      for (const programId of this.orcaProgramIds) {
        if (log.includes(programId.toBase58())) {
          return true;
        }
      }
    }
    return false;
  }

  // Alternative method: Subscribe to specific program accounts
  async subscribeToOrcaPrograms(callback: (tx: MempoolTransaction) => void): Promise<void> {
    try {
      for (const programId of this.orcaProgramIds) {
        this.connection.onLogs(
          programId,
          (logs, context) => {
            const mempoolTx: MempoolTransaction = {
              signature: logs.signature,
              slot: context.slot,
            };
            callback(mempoolTx);
          },
          'processed'
        );
      }
      logger.info(`Subscribed to ${this.orcaProgramIds.length} Orca programs`);
    } catch (error) {
      logger.error(`Error subscribing to Orca programs: ${error}`);
      throw error;
    }
  }
}