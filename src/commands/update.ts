import { Command } from '@oclif/core';
import { execSync } from 'child_process';

declare const AGENT_VERSION: string;

export default class Update extends Command {
  static override description = 'Update the Stamn agent to the latest version';

  async run(): Promise<void> {
    this.log(`Current version: ${AGENT_VERSION}`);
    this.log('Checking for updates...');

    try {
      const latest = execSync('npm view @stamn/agent version', {
        encoding: 'utf-8',
      }).trim();

      if (latest === AGENT_VERSION) {
        this.log('Already on the latest version.');
        return;
      }

      this.log(`Updating to ${latest}...`);
      execSync('npm i -g @stamn/agent@latest', { stdio: 'inherit' });
      this.log(`Updated to ${latest}.`);
    } catch (err) {
      this.error('Update failed. Try manually: npm i -g @stamn/agent@latest');
    }
  }
}
