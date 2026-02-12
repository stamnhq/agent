import type { Logger } from 'pino';
import { z } from 'zod';
import type { ServerToAgentMessageType, CommandPayload } from '@stamn/types';

// NestJS WS sends {event, data} format
const wsMessageSchema = z.object({
  event: z.string(),
  data: z.unknown(),
});

const commandPayloadSchema = z.object({
  commandId: z.string(),
  command: z.enum(['pause', 'resume', 'update_config', 'shutdown']),
  params: z.record(z.unknown()).optional(),
});

export class MessageHandler {
  constructor(
    private logger: Logger,
    private onCommand: (
      command: string,
      params?: Record<string, unknown>,
    ) => void,
  ) {}

  handle(
    raw: string,
  ): { type: ServerToAgentMessageType; payload: unknown } | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.logger.warn({ raw }, 'Invalid JSON received');
      return null;
    }

    const result = wsMessageSchema.safeParse(parsed);
    if (!result.success) {
      this.logger.warn({ error: result.error.message }, 'Invalid WS message');
      return null;
    }

    const { event, data } = result.data;

    switch (event) {
      case 'server:authenticated':
      case 'server:auth_error':
      case 'server:heartbeat_ack':
      case 'server:event':
      case 'server:spend_approved':
      case 'server:spend_denied':
        return {
          type: event as ServerToAgentMessageType,
          payload: data,
        };

      case 'server:command': {
        const cmdResult = commandPayloadSchema.safeParse(data);
        if (!cmdResult.success) {
          this.logger.warn(
            { error: cmdResult.error.message },
            'Invalid command payload',
          );
          return null;
        }

        const cmd = cmdResult.data as CommandPayload;
        this.logger.info(
          { command: cmd.command, commandId: cmd.commandId },
          'Received command',
        );
        this.onCommand(cmd.command, cmd.params);
        return { type: 'server:command', payload: cmd };
      }

      default:
        this.logger.debug({ type: event }, 'Unknown message type');
        return null;
    }
  }
}
