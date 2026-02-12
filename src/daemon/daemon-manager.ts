import {
  existsSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  mkdirSync,
} from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export class DaemonManager {
  private readonly pidDir: string;
  private readonly pidFile: string;

  constructor() {
    this.pidDir = join(homedir(), '.config', 'stamn');
    this.pidFile = join(this.pidDir, 'daemon.pid');
  }

  isRunning(): { running: boolean; pid?: number } {
    if (!existsSync(this.pidFile)) {
      return { running: false };
    }

    const raw = readFileSync(this.pidFile, 'utf-8').trim();
    const pid = parseInt(raw, 10);

    if (isNaN(pid)) {
      this.removePid();
      return { running: false };
    }

    try {
      process.kill(pid, 0);
      return { running: true, pid };
    } catch {
      // Process not alive — stale PID file
      this.removePid();
      return { running: false };
    }
  }

  writePid(pid: number): void {
    mkdirSync(this.pidDir, { recursive: true });
    writeFileSync(this.pidFile, String(pid), 'utf-8');
  }

  removePid(): void {
    try {
      unlinkSync(this.pidFile);
    } catch {
      // Already gone
    }
  }

  stop(): boolean {
    const { running, pid } = this.isRunning();
    if (!running || !pid) return false;

    try {
      process.kill(pid, 'SIGTERM');
      return true;
    } catch {
      return false;
    }
  }

  get pidFilePath(): string {
    return this.pidFile;
  }
}
