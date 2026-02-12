import { Args, Command } from '@oclif/core';
import { ConfigStore } from '../../config/config-store.js';
import { configSchema } from '../../config/config-schema.js';

const VALID_KEYS = Object.keys(configSchema.shape);

const NUMERIC_KEYS = new Set([
  'heartbeatIntervalMs',
  'wsReconnectBaseMs',
  'wsReconnectMaxMs',
]);

const KEBAB_TO_CAMEL: Record<string, string> = {
  'api-key': 'apiKey',
  'agent-id': 'agentId',
  'log-level': 'logLevel',
  'heartbeat-interval-ms': 'heartbeatIntervalMs',
  'ws-reconnect-base-ms': 'wsReconnectBaseMs',
  'ws-reconnect-max-ms': 'wsReconnectMaxMs',
};

function resolveKey(input: string): string {
  return KEBAB_TO_CAMEL[input] ?? input;
}

export default class ConfigSet extends Command {
  static override description = 'Set a configuration value';

  static override args = {
    key: Args.string({ description: 'Config key', required: true }),
    value: Args.string({ description: 'Config value', required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigSet);
    const key = resolveKey(args.key);

    if (!VALID_KEYS.includes(key)) {
      const display = Object.keys(KEBAB_TO_CAMEL).join(', ');
      this.error(`Invalid key "${args.key}". Valid keys: ${display}`);
    }

    const store = new ConfigStore();
    const parsed = NUMERIC_KEYS.has(key) ? Number(args.value) : args.value;

    store.set(key as keyof typeof configSchema.shape, parsed as never);
    this.log(`Set ${args.key} = ${key === 'apiKey' ? '****' : args.value}`);
  }
}
