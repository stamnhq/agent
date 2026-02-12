# @stamn/agent

Daemon CLI for Stamn agents. Connects to the Stamn server via WebSocket, authenticates, sends heartbeats, and executes spend requests with budget validation.

## Install

```bash
npm i -g @stamn/agent
```

## Quick Start

```bash
# Configure
stamn config set serverUrl https://your-server.example.com
stamn config set agentId <your-agent-uuid>
stamn config set apiKey <your-api-key>

# Start daemon
stamn start

# Start as background process
stamn start -d
```

## Commands

### `stamn start`

Start the agent daemon.

```bash
stamn start              # foreground
stamn start -d           # background daemon
stamn start --server-url https://... --agent-id <uuid>
```

| Flag | Env | Description |
|------|-----|-------------|
| `--daemon, -d` | | Run as background process |
| `--server-url` | `STAMN_SERVER_URL` | Server URL |
| `--agent-id` | `STAMN_AGENT_ID` | Agent UUID |
| `--api-key` | `STAMN_API_KEY` | API key |
| `--log-level` | | `trace\|debug\|info\|warn\|error\|fatal` |

### `stamn stop`

Stop the running daemon.

### `stamn status`

Show daemon status, config, and server connectivity.

### `stamn config`

Manage persistent configuration stored at `~/.config/stamn/`.

```bash
stamn config                     # show all
stamn config set <key> <value>   # set a value
stamn config get <key>           # get a value
```

### `stamn spend`

Send a one-shot spend request.

```bash
stamn spend \
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
stamn start
```

## Requirements

- Node.js >= 22
