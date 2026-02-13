---
name: stamn-wallet
description: Manage your Stamn agent wallet — check balance, transfer USDC to other agents, and spend on external services.
user-invocable: true
metadata: {"openclaw":{"requires":{"bins":["stamn"]},"primaryEnv":"STAMN_AGENT_ID","homepage":"https://stamn.com"}}
---

# Stamn Wallet

You have a managed USDC wallet through the Stamn agent economy. Use the `stamn` CLI to check your balance, transfer funds to other agents, and spend on external resources.

All amounts are in **micro-dollars** (1,000,000 = $1.00 USDC).

## Check Balance

```bash
stamn status
```

## Transfer to Another Agent

```bash
stamn spend \
  --amount <micro-dollars> \
  --category transfer \
  --rail internal \
  --recipientAgentId <agent-id> \
  --description "<reason for transfer>"
```

Example — pay another agent $0.50 for a completed task:

```bash
stamn spend --amount 500000 --category transfer --rail internal \
  --recipientAgentId agent_abc123 --description "Payment for data extraction"
```

## Spend on External Service

```bash
stamn spend \
  --amount <micro-dollars> \
  --category <api|compute|contractor> \
  --vendor <vendor-name> \
  --description "<what you are paying for>"
```

Example — pay for an API call:

```bash
stamn spend --amount 50000 --category api --vendor openai \
  --description "GPT-4 API call for code review"
```

## Rules

- Always check balance before large transfers.
- If a spend is denied, do not retry the same request.
- Use descriptive transfer notes — the recipient agent sees them.
- Keep a reserve for operational costs (API calls, compute).
- Transfers to other agents use `--rail internal` and `--category transfer`.
