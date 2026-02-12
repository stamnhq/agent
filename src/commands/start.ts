import { Command, Flags } from '@oclif/core';
import { ConfigStore } from '../config/config-store.js';
import { SERVER_URL, type AgentConfig } from '../config/config-schema.js';
import { createLogger } from '../logging/logger.js';
import { WSClient } from '../ws/ws-client.js';
import { SpendClient } from '../spend/spend-client.js';
import { DaemonManager } from '../daemon/daemon-manager.js';

export default class Start extends Command {
  static override description = 'Start the Stamn agent daemon';

  static override flags = {
    daemon: Flags.boolean({
      char: 'd',
      description: 'Run as background daemon',
      default: false,
    }),
    'agent-id': Flags.string({
      description: 'Override agent ID',
      env: 'STAMN_AGENT_ID',
    }),
    'api-key': Flags.string({
      description: 'Override API key',
      env: 'STAMN_API_KEY',
    }),
    'log-level': Flags.string({
      description: 'Override log level',
      options: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Start);
    const configStore = new ConfigStore();
    const config = { ...configStore.getAll() };

    // Apply flag overrides
    if (flags['agent-id']) config.agentId = flags['agent-id'];
    if (flags['api-key']) config.apiKey = flags['api-key'];
    if (flags['log-level'])
      config.logLevel = flags['log-level'] as AgentConfig['logLevel'];

    // Validate required fields
    if (!config.agentId) {
      this.error(
        'agentId is required. Run: stamn config set agent-id <uuid>',
      );
    }

    // Check for existing daemon
    const dm = new DaemonManager();
    const { running, pid } = dm.isRunning();
    if (running) {
      this.error(`Daemon already running (PID ${pid})`);
    }

    // Daemonize if requested
    if (flags.daemon) {
      const { daemonizeProcess } = await import('../daemon/process.js');
      await daemonizeProcess();
    }

    // Write PID
    dm.writePid(process.pid);

    const logger = createLogger(config);
    logger.info(
      { agentId: config.agentId, server: SERVER_URL },
      'Starting Stamn agent',
    );

    // Create WebSocket client
    const client = new WSClient({
      config,
      logger,
      onCommand: (command, params) => {
        logger.info({ command, params }, 'Received command');
        if (command === 'shutdown') {
          shutdown();
        }
      },
      onDisconnect: () => {
        logger.warn('Disconnected from server');
      },
      onConnected: () => {
        logger.info('Agent is online and ready — spend capability active');
      },
    });

    // Create spend client — available for plugin/task integration
    const spendClient = new SpendClient(client, logger);

    // Expose on process for external plugin access
    (globalThis as Record<string, unknown>).__stamnSpendClient = spendClient;

    // Graceful shutdown
    const shutdown = () => {
      logger.info('Shutting down...');
      client.disconnect();
      dm.removePid();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Connect
    client.connect();
  }
}
