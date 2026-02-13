import { Command, Flags } from '@oclif/core';
import { ConfigStore } from '../config/config-store.js';
import { SERVER_URL, type AgentConfig } from '../config/config-schema.js';
import { createLogger } from '../logging/logger.js';
import { WSClient } from '../ws/ws-client.js';
import { SpendClient } from '../spend/spend-client.js';
import { DaemonManager } from '../daemon/daemon-manager.js';
import { CliOpenClawClient } from '../openclaw/cli-openclaw-client.js';
import { isOpenClawRunning } from '../openclaw/probe.js';

export default class Start extends Command {
  static override description = 'Start the Stamn agent daemon';

  static override flags = {
    daemon: Flags.boolean({
      char: 'd',
      description: 'Run as background daemon',
      default: false,
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
    if (flags['log-level'])
      config.logLevel = flags['log-level'] as AgentConfig['logLevel'];

    // Interactive login when not registered
    if (!config.apiKey || !config.agentId) {
      if (flags.daemon || !process.stdout.isTTY) {
        this.error(
          'Not registered. Run `stamn login` interactively first.',
        );
      }

      const { runDeviceLogin } = await import('../ui/device-login.js');
      try {
        const result = await runDeviceLogin();
        configStore.set('apiKey', result.apiKey);
        configStore.set('agentId', result.agentId);
        configStore.set('agentName', result.agentName);
        config.apiKey = result.apiKey;
        config.agentId = result.agentId;
      } catch (err) {
        this.error((err as Error).message || 'Login cancelled.');
      }
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

    // Detect OpenClaw gateway
    const hasOpenClaw = await isOpenClawRunning();
    const openClaw = hasOpenClaw ? new CliOpenClawClient(logger) : null;
    if (hasOpenClaw) {
      logger.info('OpenClaw gateway detected on :18789');
    } else {
      logger.info('OpenClaw gateway not found — running in wallet-only mode');
    }

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
      onTransferReceived: openClaw
        ? (data) => {
            const amount = (data.amountCents / 1_000_000).toFixed(2);
            const balance = (data.yourBalanceCents / 1_000_000).toFixed(2);
            const msg =
              `ECONOMIC EVENT: You received $${amount} USDC from ${data.fromAgentName}. ` +
              `Description: "${data.description}". ` +
              `Your balance is now $${balance} USDC. ` +
              `Decide what action to take based on your strategy.`;
            logger.info(
              { from: data.fromAgentName, amountCents: data.amountCents },
              'Transfer received, injecting into OpenClaw',
            );
            openClaw.injectEvent(msg).catch((err) =>
              logger.error(
                { err: (err as Error).message },
                'Failed to inject event into OpenClaw',
              ),
            );
          }
        : undefined,
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
