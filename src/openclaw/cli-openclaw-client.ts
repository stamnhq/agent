import { execFile } from 'child_process';
import { promisify } from 'util';
import type { Logger } from 'pino';
import type { MoveDirection } from '@stamn/types';
import type { OpenClawClient } from './openclaw-client.js';

const execFileAsync = promisify(execFile);

const VALID_DIRECTIONS: MoveDirection[] = ['up', 'down', 'left', 'right'];

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

  async queryDirection(
    x: number,
    y: number,
    gridSize: number,
  ): Promise<MoveDirection | null> {
    try {
      const msg =
        `WORLD: You are at position (${x}, ${y}) on a ${gridSize}x${gridSize} grid. ` +
        `Choose a direction to move: up, down, left, right. ` +
        `Respond with ONLY the direction word.`;

      const { stdout } = await execFileAsync(
        'openclaw',
        ['agent', '--message', msg],
        { timeout: 15_000 },
      );

      const cleaned = stdout.trim().toLowerCase();
      const direction = VALID_DIRECTIONS.find((d) => cleaned.includes(d));
      return direction ?? null;
    } catch (err) {
      this.logger.debug(
        { err: (err as Error).message },
        'OpenClaw direction query failed',
      );
      return null;
    }
  }
}
