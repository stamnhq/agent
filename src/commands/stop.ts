import { Command } from '@oclif/core';
import { DaemonManager } from '../daemon/daemon-manager.js';

export default class Stop extends Command {
  static override description = 'Stop the running Stamn agent daemon';

  async run(): Promise<void> {
    const dm = new DaemonManager();
    const { running, pid } = dm.isRunning();

    if (!running) {
      this.log('No daemon is running.');
      return;
    }

    this.log(`Stopping daemon (PID ${pid})...`);
    const stopped = dm.stop();

    if (stopped) {
      this.log('Daemon stopped.');
    } else {
      this.error('Failed to stop daemon.');
    }
  }
}
