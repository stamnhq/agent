import { render } from 'ink';
import { DeviceLoginWizard } from './components/device-login-wizard.js';

export interface LoginResult {
  agentId: string;
  apiKey: string;
  agentName: string;
}

export function runDeviceLogin(): Promise<LoginResult> {
  return new Promise((resolve, reject) => {
    const { unmount, waitUntilExit } = render(
      <DeviceLoginWizard
        onComplete={(result) => {
          unmount();
          resolve(result);
        }}
        onError={(message) => {
          unmount();
          reject(new Error(message));
        }}
      />,
    );

    waitUntilExit().catch(reject);
  });
}
