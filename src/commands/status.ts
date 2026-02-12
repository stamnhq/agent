import { Command } from '@oclif/core';
import { DaemonManager } from '../daemon/daemon-manager.js';
import { ConfigStore } from '../config/config-store.js';

export default class Status extends Command {
  static override description = 'Show Stamn agent daemon status';

  async run(): Promise<void> {
    const dm = new DaemonManager();
    const configStore = new ConfigStore();
    const config = configStore.getAll();
    const { running, pid } = dm.isRunning();

    this.log('Stamn Agent Status');
    this.log('──────────────────');
    this.log(`Daemon:     ${running ? `running (PID ${pid})` : 'stopped'}`);
    this.log(`Agent ID:   ${config.agentId ?? '(not set)'}`);
    this.log(`Server URL: ${config.serverUrl}`);
    this.log(`Log Level:  ${config.logLevel}`);
    this.log(`Config:     ${configStore.path}`);
    this.log(`PID File:   ${dm.pidFilePath}`);

    if (running && config.serverUrl) {
      try {
        const res = await fetch(`${config.serverUrl}/v1/health`);
        const data = (await res.json()) as { data?: { status?: string } };
        this.log(`Server:     ${data.data?.status ?? 'unknown'}`);
      } catch {
        this.log('Server:     unreachable');
      }
    }
  }
}
