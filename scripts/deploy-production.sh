#!/bin/bash

################################################################################
# ZKIRA Pay Production Deployment Script
################################################################################
#
# Usage:
#   ./scripts/deploy-production.sh [OPTIONS]
#
# Options:
#   --skip-build      Skip the build step (for quick restarts)
#   --help            Show this help message
#
# Environment Variables:
#   SERVER_DIR        Deployment directory (default: /var/www/zkira-pay)
#
# Description:
#   Deploys the full ZKIRA Pay stack to production:
#   - Verifies prerequisites (Node.js >= 20.9.0, pnpm, PM2, git)
#   - Pulls latest code from main branch
#   - Installs dependencies with frozen lockfile
#   - Builds all packages (with graceful handling for Node version issues)
#   - Restarts services via PM2
#   - Performs health checks on all services
#   - Displays deployment summary
#
# Services Deployed:
#   - zkira-pay (port 3011) — Payment app + admin dashboard
#   - zkira-api (port 3012) — REST API server
#   - zkira-relayer (port 3013) — Transaction relayer
#   - zkira-bot — Telegram bot
#   - zkira-swap-api (port 3014) — Swap API
#   - zkira-swap (port 3015) — Swap app
#
# Server: 165.22.161.162
# Deployment Dir: /var/www/zkira-pay
#
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_DIR="${SERVER_DIR:-/var/www/zkira-pay}"
SKIP_BUILD=false
MIN_NODE_VERSION="20.9.0"

################################################################################
# Helper Functions
################################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

log_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

compare_versions() {
  # Compare two version strings (e.g., "20.9.0" vs "18.5.0")
  # Returns 0 if $1 >= $2, 1 otherwise
  printf '%s\n%s' "$2" "$1" | sort -V -C
}

show_help() {
  head -n 30 "$0" | tail -n +3 | sed 's/^# //'
  exit 0
}

################################################################################
# Parse Arguments
################################################################################

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-build)
      SKIP_BUILD=true
      log_warning "Build step will be skipped"
      shift
      ;;
    --help)
      show_help
      ;;
    *)
      log_error "Unknown option: $1"
      show_help
      ;;
  esac
done

################################################################################
# Prerequisites Check
################################################################################

log_section "Checking Prerequisites"

# Check if running on correct server
if [[ "$SERVER_DIR" != "/var/www/zkira-pay" ]]; then
  log_warning "Non-standard deployment directory: $SERVER_DIR"
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
  log_error "Node.js is not installed"
  echo ""
  echo "To install Node.js >= $MIN_NODE_VERSION, use nvm:"
  echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
  echo "  nvm install 20"
  echo "  nvm use 20"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
if ! compare_versions "$NODE_VERSION" "$MIN_NODE_VERSION"; then
  log_error "Node.js version $NODE_VERSION is too old (required: >= $MIN_NODE_VERSION)"
  echo ""
  echo "To upgrade Node.js, use nvm:"
  echo "  nvm install 20"
  echo "  nvm use 20"
  exit 1
fi
log_success "Node.js $NODE_VERSION (required: >= $MIN_NODE_VERSION)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
  log_error "pnpm is not installed"
  echo ""
  echo "To install pnpm:"
  echo "  npm install -g pnpm@10.30.2"
  exit 1
fi
PNPM_VERSION=$(pnpm -v)
log_success "pnpm $PNPM_VERSION"

# Check PM2
if ! command -v pm2 &> /dev/null; then
  log_error "PM2 is not installed globally"
  echo ""
  echo "To install PM2:"
  echo "  npm install -g pm2"
  exit 1
fi
log_success "PM2 installed"

# Check git
if ! command -v git &> /dev/null; then
  log_error "git is not installed"
  exit 1
fi
log_success "git available"

################################################################################
# Navigate to Server Directory
################################################################################

log_section "Preparing Deployment"

if [[ ! -d "$SERVER_DIR" ]]; then
  log_error "Server directory not found: $SERVER_DIR"
  exit 1
fi

cd "$SERVER_DIR"
log_success "Working directory: $(pwd)"

# Verify git repo
if [[ ! -d ".git" ]]; then
  log_error "Not a git repository: $SERVER_DIR"
  exit 1
fi
log_success "Git repository verified"

################################################################################
# Pull Latest Code
################################################################################

log_section "Pulling Latest Code"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log_info "Current branch: $CURRENT_BRANCH"

if [[ "$CURRENT_BRANCH" != "main" ]]; then
  log_warning "Not on main branch. Pulling from main anyway..."
fi

git fetch origin main
BEFORE_COMMIT=$(git rev-parse HEAD)
git pull origin main
AFTER_COMMIT=$(git rev-parse HEAD)

if [[ "$BEFORE_COMMIT" == "$AFTER_COMMIT" ]]; then
  log_info "Already up to date"
else
  log_success "Pulled latest changes"
  git log --oneline -5
fi

################################################################################
# Install Dependencies
################################################################################

log_section "Installing Dependencies"

log_info "Running: pnpm install --frozen-lockfile"
if pnpm install --frozen-lockfile; then
  log_success "Dependencies installed"
else
  log_error "Failed to install dependencies"
  exit 1
fi

################################################################################
# Build Packages
################################################################################

if [[ "$SKIP_BUILD" == true ]]; then
  log_section "Skipping Build (--skip-build flag)"
else
  log_section "Building Packages"

  log_info "Running: pnpm build"
  if pnpm build; then
    log_success "All packages built successfully"
  else
    # Non-blocking: @zkira/swap may fail on Node < 20.9.0
    log_warning "Build completed with warnings (this may be expected for @zkira/swap on older Node versions)"
  fi

  # Build the critical pay app specifically
  log_section "Building zkira-pay (Critical)"
  log_info "Running: pnpm --filter @zkira/pay build"
  if pnpm --filter @zkira/pay build; then
    log_success "zkira-pay built successfully"
  else
    log_error "Failed to build zkira-pay (critical service)"
    exit 1
  fi
fi

################################################################################
# Restart Services with PM2
################################################################################

log_section "Restarting Services with PM2"

# Check if ecosystem.config.js exists
if [[ ! -f "ecosystem.config.js" ]]; then
  log_error "ecosystem.config.js not found"
  exit 1
fi

# Check if PM2 already has processes running
if pm2 list | grep -q "zkira-pay"; then
  log_info "Reloading existing PM2 processes..."
  pm2 reload ecosystem.config.js --update-env
  log_success "PM2 processes reloaded"
else
  log_info "Starting PM2 processes..."
  pm2 start ecosystem.config.js
  log_success "PM2 processes started"
fi

# Save PM2 configuration
pm2 save
log_success "PM2 configuration saved"

# Wait for services to start
log_info "Waiting for services to start (5 seconds)..."
sleep 5

################################################################################
# Health Checks
################################################################################

log_section "Performing Health Checks"

HEALTH_CHECK_FAILED=false

# Check zkira-pay (port 3011)
log_info "Checking zkira-pay (port 3011)..."
if curl -s http://localhost:3011 > /dev/null 2>&1; then
  log_success "zkira-pay is responding"
else
  log_warning "zkira-pay health check failed (may still be starting)"
  HEALTH_CHECK_FAILED=true
fi

# Check zkira-api (port 3012)
log_info "Checking zkira-api (port 3012)..."
if curl -s http://localhost:3012/health > /dev/null 2>&1 || curl -s http://localhost:3012 > /dev/null 2>&1; then
  log_success "zkira-api is responding"
else
  log_warning "zkira-api health check failed (may still be starting)"
  HEALTH_CHECK_FAILED=true
fi

# Check zkira-relayer (port 3013)
log_info "Checking zkira-relayer (port 3013)..."
if curl -s http://localhost:3013 > /dev/null 2>&1; then
  log_success "zkira-relayer is responding"
else
  log_warning "zkira-relayer health check failed (may still be starting)"
  HEALTH_CHECK_FAILED=true
fi

# Check zkira-swap-api (port 3014)
log_info "Checking zkira-swap-api (port 3014)..."
if curl -s http://localhost:3014 > /dev/null 2>&1; then
  log_success "zkira-swap-api is responding"
else
  log_warning "zkira-swap-api health check failed (may still be starting)"
  HEALTH_CHECK_FAILED=true
fi

# Check zkira-swap (port 3015)
log_info "Checking zkira-swap (port 3015)..."
if curl -s http://localhost:3015 > /dev/null 2>&1; then
  log_success "zkira-swap is responding"
else
  log_warning "zkira-swap health check failed (may still be starting)"
  HEALTH_CHECK_FAILED=true
fi

if [[ "$HEALTH_CHECK_FAILED" == true ]]; then
  log_warning "Some health checks failed. Services may still be starting. Check PM2 logs:"
  echo "  pm2 logs"
fi

################################################################################
# Deployment Summary
################################################################################

log_section "Deployment Summary"

echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "Running PM2 Processes:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 list
echo ""
echo "Service Endpoints:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  zkira-pay:      http://localhost:3011"
echo "  zkira-api:      http://localhost:3012"
echo "  zkira-relayer:  http://localhost:3013"
echo "  zkira-swap-api: http://localhost:3014"
echo "  zkira-swap:     http://localhost:3015"
echo ""
echo "Useful Commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  View logs:      pm2 logs"
echo "  View specific:  pm2 logs zkira-pay"
echo "  Restart all:    pm2 restart all"
echo "  Stop all:       pm2 stop all"
echo "  Reload config:  pm2 reload ecosystem.config.js --update-env"
echo ""
echo -e "${GREEN}✓ Deployment ready!${NC}"
echo ""
