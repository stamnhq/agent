import { useState } from 'react';
import { Box, Text } from 'ink';
import { TextInput, Spinner, StatusMessage } from '@inkjs/ui';

type Step = 'api-key' | 'registering' | 'done';

interface Props {
  onComplete: (result: { agentId: string; apiKey: string; agentName: string }) => void;
  onError: (message: string) => void;
}

declare const AGENT_VERSION: string;

export function SetupWizard({ onComplete, onError }: Props) {
  const [step, setStep] = useState<Step>('api-key');
  const [error, setError] = useState('');

  const register = async (apiKey: string) => {
    setStep('registering');

    try {
      const { SERVER_URL } = await import('../../config/config-schema.js');
      const res = await fetch(`${SERVER_URL}/v1/agents/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          platform: `${process.platform}-${process.arch}`,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }

      const json = (await res.json()) as {
        data: { id: string; name: string };
      };
      setStep('done');
      onComplete({
        agentId: json.data.id,
        apiKey,
        agentName: json.data.name,
      });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'fetch failed' || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
        onError('Could not connect to Stamn. Is the server running?');
      } else {
        onError(msg);
      }
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          stamn
        </Text>
        <Text dimColor> setup</Text>
      </Box>

      {step === 'api-key' && (
        <Box flexDirection="column">
          <Text>Enter your API key from the Stamn dashboard.</Text>
          <Box marginTop={1}>
            <Text color="cyan">{"> "}</Text>
            <TextInput
              placeholder="sk-..."
              onSubmit={(value: string) => {
                if (!value.trim()) {
                  setError('API key cannot be empty');
                  return;
                }
                setError('');
                register(value.trim());
              }}
            />
          </Box>
          {error && step === 'api-key' && (
            <StatusMessage variant="error">{error}</StatusMessage>
          )}
        </Box>
      )}

      {step === 'registering' && (
        <Box>
          <Spinner label="Registering agent..." />
        </Box>
      )}

      {step === 'done' && (
        <StatusMessage variant="success">
          Agent registered. Starting...
        </StatusMessage>
      )}

      {step === 'api-key' && (
        <Box marginTop={1}>
          <Text dimColor>Press Ctrl+C to cancel</Text>
        </Box>
      )}
    </Box>
  );
}
