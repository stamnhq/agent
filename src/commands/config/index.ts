import { Command } from '@oclif/core';
import { ConfigStore } from '../../config/config-store.js';

export default class ConfigShow extends Command {
  static override description = 'Show current configuration';

  async run(): Promise<void> {
    const store = new ConfigStore();
    const config = store.getAll();

    this.log(`Config file: ${store.path}\n`);

    for (const [key, value] of Object.entries(config)) {
      const display =
        key === 'apiKey' && value
          ? `${String(value).slice(0, 4)}...`
          : (value ?? '(not set)');
      this.log(`  ${key}: ${display}`);
    }
  }
}
