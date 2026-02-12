import { render } from 'ink';
import { SetupWizard } from './components/setup-wizard.js';

export interface SetupResult {
  agentId: string;
  apiKey: string;
  agentName: string;
}

export function runSetup(): Promise<SetupResult> {
  return new Promise((resolve, reject) => {
    const { unmount, waitUntilExit } = render(
      <SetupWizard
        onComplete={(result) => {
          unmount();
          resolve(result);
        }}
      />,
    );

    waitUntilExit().catch(reject);
  });
}
