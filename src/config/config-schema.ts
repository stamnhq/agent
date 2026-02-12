import { z } from 'zod';

export const configSchema = z.object({
  serverUrl: z.string().url().default('http://localhost:3001'),
  apiKey: z.string().min(1).optional(),
  agentId: z.string().uuid().optional(),
  logLevel: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  heartbeatIntervalMs: z.number().int().positive().default(30_000),
  wsReconnectBaseMs: z.number().int().positive().default(1_000),
  wsReconnectMaxMs: z.number().int().positive().default(30_000),
});

export type AgentConfig = z.infer<typeof configSchema>;

export const CONFIG_DEFAULTS: AgentConfig = configSchema.parse({});
