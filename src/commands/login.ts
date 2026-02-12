import { Command } from '@oclif/core';
import { ConfigStore } from '../config/config-store.js';

export default class Login extends Command {
  static override description =
    'Log in to Stamn via the dashboard (device code flow)';

  async run(): Promise<void> {
    if (!process.stdout.isTTY) {
      this.error(
        'Interactive login requires a terminal. Use `stamn start` with an existing config.',
      );
    }

    const { runDeviceLogin } = await import('../ui/device-login.js');

    try {
      const result = await runDeviceLogin();
      const store = new ConfigStore();
      store.set('apiKey', result.apiKey);
      store.set('agentId', result.agentId);
      store.set('agentName', result.agentName);
      this.log(`\nAgent "${result.agentName}" ready. Run \`stamn start\` to connect.`);
    } catch (err) {
      this.error((err as Error).message || 'Login cancelled.');
    }
  }
}
