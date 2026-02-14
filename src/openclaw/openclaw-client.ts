import type { MoveDirection } from '@stamn/types';

export interface OpenClawClient {
  injectEvent(message: string): Promise<void>;
  queryDirection(x: number, y: number, gridSize: number): Promise<MoveDirection | null>;
}
