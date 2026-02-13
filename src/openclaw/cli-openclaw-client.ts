import { execFile } from 'child_process';
import { promisify } from 'util';
import type { Logger } from 'pino';
import type { OpenClawClient } from './openclaw-client.js';

const execFileAsync = promisify(execFile);

export class CliOpenClawClient implements OpenClawClient {
  constructor(private logger: Logger) {}

  async injectEvent(message: string): Promise<void> {
    try {
      await execFileAsync('openclaw', ['agent', '--message', message], {
        timeout: 30_000,
      });
      this.logger.info('Injected economic event into OpenClaw');
    } catch (err) {
      this.logger.error(
        { err: (err as Error).message },
        'Failed to inject event into OpenClaw',
      );
    }
  }
}
