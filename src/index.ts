import { logger } from './utils/logger';
import { config } from './config';
import { MempoolListener } from './core/mempool-listener';
import { OpportunityAnalyzer } from './core/opportunity-analyzer';
import { BundlerEngine } from './core/bundler-engine';
import { TransactionExecutor } from './core/transaction-executor';
import { MonitoringService } from './core/monitoring-service';

class OrcaBundlerBot {
  private mempoolListener: MempoolListener;
  private opportunityAnalyzer: OpportunityAnalyzer;
  private bundlerEngine: BundlerEngine;
  private transactionExecutor: TransactionExecutor;
  private monitoringService: MonitoringService;
  private isRunning: boolean = false;

  constructor() {
    logger.info('Initializing Orca Bundler Bot...');
    
    this.monitoringService = new MonitoringService();
    this.opportunityAnalyzer = new OpportunityAnalyzer(this.monitoringService);
    this.bundlerEngine = new BundlerEngine();
    this.transactionExecutor = new TransactionExecutor(this.monitoringService);
    this.mempoolListener = new MempoolListener();
    
    this.setupShutdownHandlers();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Bot is already running');
      return;
    }

    try {
      logger.info('Starting Orca Bundler Bot...');
      this.isRunning = true;

      // Start monitoring service
      this.monitoringService.start();

      // Start listening to mempool
      await this.mempoolListener.startListening(async (tx) => {
        try {
          // Analyze transaction for opportunities
          const opportunities = await this.opportunityAnalyzer.analyzeTransaction(tx);
          
          if (opportunities.length > 0) {
            logger.info(`Found ${opportunities.length} trade opportunities`);
            
            // Bundle opportunities
            const bundle = await this.bundlerEngine.createBundle(opportunities);
            
            // Execute the bundle
            await this.transactionExecutor.executeBundle(bundle);
          }
        } catch (error) {
          logger.error(`Error processing transaction ${tx.signature}: ${error}`);
        }
      });

      logger.info('Orca Bundler Bot started successfully');
    } catch (error) {
      logger.error(`Failed to start bot: ${error}`);
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping Orca Bundler Bot...');
    this.isRunning = false;
    
    this.mempoolListener.stopListening();
    this.monitoringService.stop();
    
    logger.info('Orca Bundler Bot stopped');
  }

  private setupShutdownHandlers(): void {
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down...');
      await this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down...');
      await this.stop();
      process.exit(0);
    });

    process.on('uncaughtException', async (error) => {
      logger.error(`Uncaught exception: ${error}`);
      await this.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      logger.error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
      await this.stop();
      process.exit(1);
    });
  }

  getStatus(): { isRunning: boolean } {
    return { isRunning: this.isRunning };
  }
}

// Create and start the bot
const bot = new OrcaBundlerBot();

// Start the bot if this file is run directly
if (require.main === module) {
  bot.start().catch(error => {
    logger.error(`Failed to start bot: ${error}`);
    process.exit(1);
  });
}

export { OrcaBundlerBot };
export default bot;