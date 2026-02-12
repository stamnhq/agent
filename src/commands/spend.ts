import { Command, Flags } from '@oclif/core';
import { ConfigStore } from '../config/config-store.js';
import { createLogger } from '../logging/logger.js';
import { WSClient } from '../ws/ws-client.js';
import { SpendClient } from '../spend/spend-client.js';
import type { LedgerCategory, LedgerRail } from '@stamn/types';

export default class Spend extends Command {
  static override description =
    'Send a spend request through the connected agent';

  static override flags = {
    amount: Flags.integer({
      required: true,
      description: 'Amount in cents',
    }),
    category: Flags.string({
      required: true,
      description: 'Spend category',
      options: ['api', 'compute', 'contractor', 'transfer'],
    }),
    rail: Flags.string({
      required: true,
      description: 'Payment rail',
      options: ['crypto_onchain', 'x402', 'internal'],
    }),
    vendor: Flags.string({ description: 'Vendor name' }),
    description: Flags.string({
      required: true,
      description: 'Spend description',
    }),
    'recipient-agent': Flags.string({
      description: 'Recipient agent ID (for agent-to-agent)',
    }),
    'recipient-address': Flags.string({
      description: 'Recipient wallet address (for on-chain)',
    }),
    'agent-id': Flags.string({ env: 'STAMN_AGENT_ID' }),
    'api-key': Flags.string({ env: 'STAMN_API_KEY' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Spend);
    const configStore = new ConfigStore();
    const config = { ...configStore.getAll() };

    if (flags['agent-id']) config.agentId = flags['agent-id'];
    if (flags['api-key']) config.apiKey = flags['api-key'];

    if (!config.agentId) {
      this.error('agentId is required. Run: stamn config set agent-id <uuid>');
    }

    const logger = createLogger({ logLevel: 'info' });

    this.log('Connecting to Stamn...');

    const client = new WSClient({
      config,
      logger,
      onCommand: () => {},
      onDisconnect: () => {},
      onConnected: async () => {
        this.log('Authenticated. Sending spend request...\n');

        const spendClient = new SpendClient(client, logger);
        const result = await spendClient.request({
          amountCents: flags.amount,
          category: flags.category as LedgerCategory,
          rail: flags.rail as LedgerRail,
          vendor: flags.vendor,
          description: flags.description,
          recipientAgentId: flags['recipient-agent'],
          recipientAddress: flags['recipient-address'],
        });

        if (result.approved) {
          this.log('Spend APPROVED');
          this.log(`  Ledger Entry: ${result.ledgerEntryId}`);
          if (result.transactionHash) {
            this.log(`  Tx Hash:      ${result.transactionHash}`);
          }
          this.log(`  Remaining:    ${result.remainingBalanceCents} cents`);
        } else {
          this.log('Spend DENIED');
          this.log(`  Reason: ${result.reason}`);
          this.log(`  Code:   ${result.code}`);
        }

        client.disconnect();
        process.exit(0);
      },
    });

    client.connect();
  }
}
