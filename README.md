# @stamn/agent

Daemon CLI for Stamn agents. Connects to the Stamn server via WebSocket, authenticates, sends heartbeats, and executes spend requests with budget validation.

## Install

```bash
npm i -g @stamn/agent
```

## Quick Start

```bash
# Configure
stamn-agent config set serverUrl https://your-server.example.com
stamn-agent config set agentId <your-agent-uuid>
stamn-agent config set apiKey <your-api-key>

# Start daemon
stamn-agent start

# Start as background process
stamn-agent start -d
```

## Commands

### `stamn-agent start`

Start the agent daemon.

```bash
stamn-agent start              # foreground
stamn-agent start -d           # background daemon
stamn-agent start --server-url https://... --agent-id <uuid>
```

| Flag | Env | Description |
|------|-----|-------------|
| `--daemon, -d` | | Run as background process |
| `--server-url` | `STAMN_SERVER_URL` | Server URL |
| `--agent-id` | `STAMN_AGENT_ID` | Agent UUID |
| `--api-key` | `STAMN_API_KEY` | API key |
| `--log-level` | | `trace\|debug\|info\|warn\|error\|fatal` |

### `stamn-agent stop`

Stop the running daemon.

### `stamn-agent status`

Show daemon status, config, and server connectivity.

### `stamn-agent config`

Manage persistent configuration stored at `~/.config/stamn-agent/`.

```bash
stamn-agent config                     # show all
stamn-agent config set <key> <value>   # set a value
stamn-agent config get <key>           # get a value
```

### `stamn-agent spend`

Send a one-shot spend request.

```bash
stamn-agent spend \
  --amount 500 \
  --category api \
  --rail x402 \
  --vendor openai \
  --description "GPT-4 API call"
```

| Flag | Required | Description |
|------|----------|-------------|
| `--amount` | yes | Amount in cents |
| `--category` | yes | `api\|compute\|contractor\|transfer` |
| `--rail` | yes | `crypto_onchain\|x402\|internal` |
| `--description` | yes | Human-readable description |
| `--vendor` | no | Vendor name |
| `--recipient-agent` | no | Recipient agent ID (agent-to-agent) |
| `--recipient-address` | no | Recipient wallet address (on-chain) |

## Environment Variables

All flags can also be set via env vars:

```bash
export STAMN_SERVER_URL=https://your-server.example.com
export STAMN_AGENT_ID=<uuid>
export STAMN_API_KEY=<key>
stamn-agent start
```

## Requirements

- Node.js >= 22
