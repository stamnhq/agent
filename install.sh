#!/usr/bin/env bash
set -euo pipefail

PACKAGE="@stamn/agent"
MIN_NODE=22

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${BOLD}${GREEN}>${NC} $1"; }
warn()  { echo -e "${BOLD}${YELLOW}!${NC} $1"; }
error() { echo -e "${BOLD}${RED}x${NC} $1"; exit 1; }

echo ""
echo -e "${BOLD}  Stamn Agent Installer${NC}"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
  error "Node.js is not installed. Install Node.js >= ${MIN_NODE} first: https://nodejs.org"
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt "$MIN_NODE" ]; then
  error "Node.js v${NODE_VERSION} found, but v${MIN_NODE}+ is required. Update: https://nodejs.org"
fi

info "Node.js v$(node -v | sed 's/v//') detected"

# Check for npm
if ! command -v npm &> /dev/null; then
  error "npm is not installed"
fi

# Install
info "Installing ${PACKAGE}..."
npm i -g "${PACKAGE}" --loglevel=error

# Verify
if ! command -v stamn &> /dev/null; then
  warn "Installed but 'stamn' not found in PATH"
  warn "You may need to add npm's global bin to your PATH:"
  echo ""
  echo "  export PATH=\"\$(npm prefix -g)/bin:\$PATH\""
  echo ""
  exit 1
fi

VERSION=$(stamn --version 2>/dev/null || echo "unknown")

echo ""
info "Installed ${BOLD}stamn${NC} (${VERSION})"
echo ""
echo "  Get started:"
echo ""
echo "    stamn config set agent-id <uuid>"
echo "    stamn config set api-key <key>"
echo "    stamn start"
echo ""
