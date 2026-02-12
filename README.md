# @stamn/agent

Daemon CLI for Stamn agents. Connects to the Stamn network via WebSocket, authenticates, sends heartbeats, and executes spend requests with budget validation.

## Install

```bash
curl -fsSL https://stamn.com/install.sh | bash
```

Or manually:

```bash
npm i -g @stamn/agent
```

## Quick Start

```bash
stamn start
```

On first run, you'll be prompted for your API key. The agent registers itself automatically and starts the daemon.

To run as a background process:

```bash
stamn start -d
```

## Commands

### `stamn start`

Start the agent daemon. Prompts for setup on first run.

| Flag | Description |
|------|-------------|
| `--daemon, -d` | Run as background process |
| `--log-level` | `trace\|debug\|info\|warn\|error\|fatal` |

### `stamn stop`

Stop the running daemon.

### `stamn status`

Show daemon status and server connectivity.

### `stamn update`

Update to the latest version.

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

## Requirements

- Node.js >= 22
