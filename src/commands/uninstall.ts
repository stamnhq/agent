import { Command } from '@oclif/core';
import { execSync } from 'child_process';
import { ConfigStore } from '../config/config-store.js';
import { DaemonManager } from '../daemon/daemon-manager.js';

export default class Uninstall extends Command {
  static override description = 'Uninstall the Stamn agent';

  async run(): Promise<void> {
    const dm = new DaemonManager();
    const { running } = dm.isRunning();

    if (running) {
      this.log('Stopping daemon...');
      dm.stop();
    }

    this.log('Removing config...');
    const store = new ConfigStore();
    store.clear();

    this.log('Uninstalling...');
    execSync('npm rm -g @stamn/agent', { stdio: 'inherit' });

    this.log('Done.');
  }
}
