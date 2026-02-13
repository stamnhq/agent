import { Command, Flags } from '@oclif/core';
import { ConfigStore } from '../../config/config-store.js';

export default class ConfigReset extends Command {
  static override description =
    'Reset configuration to defaults (clears agent registration)';

  static override flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Skip confirmation prompt',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConfigReset);
    const store = new ConfigStore();

    if (!flags.force && process.stdout.isTTY) {
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question(
          'This will clear all config including agent registration. Continue? [y/N] ',
          resolve,
        );
      });
      rl.close();

      if (answer.toLowerCase() !== 'y') {
        this.log('Aborted.');
        return;
      }
    }

    store.clear();
    this.log('Configuration reset to defaults.');
  }
}
