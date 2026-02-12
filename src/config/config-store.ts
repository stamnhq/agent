import Conf from 'conf';
import { configSchema, CONFIG_DEFAULTS, type AgentConfig } from './config-schema.js';

export class ConfigStore {
  private store: Conf<AgentConfig>;

  constructor() {
    this.store = new Conf<AgentConfig>({
      projectName: 'stamn',
      defaults: CONFIG_DEFAULTS,
    });
  }

  get<K extends keyof AgentConfig>(key: K): AgentConfig[K] {
    return this.store.get(key);
  }

  set<K extends keyof AgentConfig>(key: K, value: AgentConfig[K]): void {
    configSchema.partial().parse({ [key]: value });
    this.store.set(key, value);
  }

  getAll(): AgentConfig {
    return configSchema.parse(this.store.store);
  }

  clear(): void {
    this.store.clear();
  }

  get path(): string {
    return this.store.path;
  }
}
