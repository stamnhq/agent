import { Args, Command } from '@oclif/core';
import { ConfigStore } from '../../config/config-store.js';
import { configSchema } from '../../config/config-schema.js';

const VALID_KEYS = Object.keys(configSchema.shape);

export default class ConfigGet extends Command {
  static override description = 'Get a configuration value';

  static override args = {
    key: Args.string({ description: 'Config key', required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigGet);

    if (!VALID_KEYS.includes(args.key)) {
      this.error(
        `Invalid key "${args.key}". Valid keys: ${VALID_KEYS.join(', ')}`,
      );
    }

    const store = new ConfigStore();
    const value = store.get(args.key as keyof typeof configSchema.shape);
    this.log(value != null ? String(value) : '(not set)');
  }
}
