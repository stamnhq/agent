import { Command } from '@oclif/core';
import { DaemonManager } from '../daemon/daemon-manager.js';
import { ConfigStore } from '../config/config-store.js';
import { SERVER_URL } from '../config/config-schema.js';

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
    this.log(`Agent:      ${config.agentName ?? config.agentId ?? '(not registered)'}`);
    this.log(`Log Level:  ${config.logLevel}`);
    this.log(`Config:     ${configStore.path}`);
    this.log(`PID File:   ${dm.pidFilePath}`);

    if (running) {
      try {
        const res = await fetch(`${SERVER_URL}/v1/health`);
        const data = (await res.json()) as { data?: { status?: string } };
        this.log(`Server:     ${data.data?.status ?? 'unknown'}`);
      } catch {
        this.log('Server:     unreachable');
      }
    }
  }
}
