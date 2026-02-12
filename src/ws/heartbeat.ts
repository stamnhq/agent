import type { HeartbeatPayload } from '@stamn/types';

export interface HeartbeatSender {
  send<T>(type: string, payload: T): void;
  reconnect(): void;
}

export class Heartbeat {
  private timer: ReturnType<typeof setInterval> | null = null;
  private missedPongs = 0;
  private readonly maxMissedPongs = 3;

  constructor(
    private sender: HeartbeatSender,
    private agentId: string,
    private intervalMs: number,
    private startTime: number,
  ) {}

  start(): void {
    this.missedPongs = 0;
    this.timer = setInterval(() => {
      if (this.missedPongs >= this.maxMissedPongs) {
        this.sender.reconnect();
        return;
      }

      const payload: HeartbeatPayload = {
        agentId: this.agentId,
        uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
        memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      };

      this.sender.send('agent:heartbeat', payload);
      this.missedPongs++;
    }, this.intervalMs);
  }

  onAck(): void {
    this.missedPongs = 0;
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
