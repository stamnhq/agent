import { Args, Command } from '@oclif/core';
import { ConfigStore } from '../../config/config-store.js';
import { configSchema } from '../../config/config-schema.js';

const VALID_KEYS = Object.keys(configSchema.shape);

const NUMERIC_KEYS = new Set([
  'heartbeatIntervalMs',
  'wsReconnectBaseMs',
  'wsReconnectMaxMs',
]);

export default class ConfigSet extends Command {
  static override description = 'Set a configuration value';

  static override args = {
    key: Args.string({ description: 'Config key', required: true }),
    value: Args.string({ description: 'Config value', required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigSet);

    if (!VALID_KEYS.includes(args.key)) {
      this.error(
        `Invalid key "${args.key}". Valid keys: ${VALID_KEYS.join(', ')}`,
      );
    }

    const store = new ConfigStore();
    const parsed = NUMERIC_KEYS.has(args.key)
      ? Number(args.value)
      : args.value;

    store.set(args.key as keyof typeof configSchema.shape, parsed as never);
    this.log(
      `Set ${args.key} = ${args.key === 'apiKey' ? '****' : args.value}`,
    );
  }
}
