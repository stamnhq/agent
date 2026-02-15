import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { TextInput, Spinner, StatusMessage } from '@inkjs/ui';

type Step = 'requesting' | 'waiting' | 'naming' | 'registering' | 'done';

const SAFE_NAME = /^[a-zA-Z0-9 _\-\.]+$/;

interface DeviceFlowData {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
}

interface Props {
  onComplete: (result: {
    agentId: string;
    apiKey: string;
    agentName: string;
  }) => void;
  onError: (message: string) => void;
}

declare const AGENT_VERSION: string;

const POLL_INTERVAL_MS = 5_000;

export function DeviceLoginWizard({ onComplete, onError }: Props) {
  const [step, setStep] = useState<Step>('requesting');
  const [flow, setFlow] = useState<DeviceFlowData | null>(null);
  const [pendingApiKey, setPendingApiKey] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [nameError, setNameError] = useState('');

  // Step 1: Initiate device flow
  useEffect(() => {
    let cancelled = false;

    const initiate = async () => {
      try {
        const { SERVER_URL } = await import(
          '../../config/config-schema.js'
        );
        const res = await fetch(`${SERVER_URL}/v1/auth/device-codes`, {
          method: 'POST',
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(body || `HTTP ${res.status}`);
        }

        const json = (await res.json()) as { data: DeviceFlowData };
        if (!cancelled) {
          setFlow(json.data);
          setStep('waiting');
        }
      } catch (err) {
        if (cancelled) return;
        const msg = (err as Error).message;
        if (
          msg === 'fetch failed' ||
          msg.includes('ECONNREFUSED') ||
          msg.includes('ENOTFOUND')
        ) {
          onError('Could not connect to Stamn. Check your network.');
        } else {
          onError(msg);
        }
      }
    };

    initiate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Step 2: Poll for approval
  useEffect(() => {
    if (step !== 'waiting' || !flow) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const { SERVER_URL } = await import(
          '../../config/config-schema.js'
        );
        const res = await fetch(
          `${SERVER_URL}/v1/auth/device-codes/${flow.deviceCode}`,
        );

        if (!res.ok) return;

        const json = (await res.json()) as {
          data: { status: string; apiKey?: string };
        };

        if (cancelled) return;

        if (json.data.status === 'approved' && json.data.apiKey) {
          setPendingApiKey(json.data.apiKey);
          setStep('naming');
        } else if (json.data.status === 'expired') {
          onError('Login code expired. Run `stamn login` again.');
        }
      } catch {
        // Silently retry on network errors during polling
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    // First poll immediately
    poll();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [step, flow]);

  const registerAgent = async (apiKey: string, name: string) => {
    try {
      const { SERVER_URL } = await import(
        '../../config/config-schema.js'
      );
      const res = await fetch(`${SERVER_URL}/v1/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          name: name || undefined,
          platform: `${process.platform}-${process.arch}`,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        let message = `HTTP ${res.status}`;
        try {
          const parsed = JSON.parse(body);
          if (Array.isArray(parsed.message)) {
            message = parsed.message.join('. ');
          } else if (typeof parsed.message === 'string') {
            message = parsed.message;
          }
        } catch {
          if (body) message = body;
        }
        throw new Error(message);
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
      onError((err as Error).message || 'Registration failed');
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          stamn
        </Text>
        <Text dimColor> login</Text>
      </Box>

      {step === 'requesting' && (
        <Spinner label="Requesting login code..." />
      )}

      {step === 'waiting' && flow && (
        <Box flexDirection="column">
          <Text>
            Open{' '}
            <Text bold color="cyan">
              {flow.verificationUri}
            </Text>
          </Text>
          <Text>
            and enter code:{' '}
            <Text bold color="yellow">
              {flow.userCode}
            </Text>
          </Text>
          <Box marginTop={1}>
            <Spinner label="Waiting for approval..." />
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press Ctrl+C to cancel</Text>
          </Box>
        </Box>
      )}

      {step === 'naming' && (
        <Box flexDirection="column">
          <StatusMessage variant="success">Approved!</StatusMessage>
          <Box marginTop={1}>
            <Text>Agent name: </Text>
            <TextInput
              placeholder="my-agent"
              onSubmit={(value) => {
                if (value && !SAFE_NAME.test(value)) {
                  setNameError('Only letters, numbers, spaces, hyphens, underscores, and dots are allowed.');
                  return;
                }
                if (value && value.length > 100) {
                  setNameError('Name must be 100 characters or less.');
                  return;
                }
                setNameError('');
                setAgentName(value);
                setStep('registering');
                registerAgent(pendingApiKey!, value);
              }}
            />
          </Box>
          {nameError ? (
            <Box marginTop={1}>
              <StatusMessage variant="error">{nameError}</StatusMessage>
            </Box>
          ) : (
            <Box marginTop={1}>
              <Text dimColor>Press Enter to confirm (leave empty for auto-generated name)</Text>
            </Box>
          )}
        </Box>
      )}

      {step === 'registering' && (
        <Spinner label="Registering agent..." />
      )}

      {step === 'done' && (
        <StatusMessage variant="success">
          Logged in and agent registered.
        </StatusMessage>
      )}
    </Box>
  );
}
