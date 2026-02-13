import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function isOpenClawRunning(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(
      'openclaw',
      ['gateway', 'status'],
      { timeout: 5000 },
    );
    return stdout.includes('Runtime: running');
  } catch {
    return false;
  }
}
