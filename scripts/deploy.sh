#!/usr/bin/env bash
# Builds the site and (optionally) restarts the service.
#
#   ./scripts/deploy.sh              pull, install, build, restart, health check
#   ./scripts/deploy.sh --no-pull    skip "git pull" (e.g. after checking out an old commit)
#   ./scripts/deploy.sh --no-restart build only (first install, before the service exists)
#
# Run it from the server as the user that owns the project (see DEPLOY.md).
set -euo pipefail

SERVICE="${SERVICE:-pompasys}"
PORT="${PORT:-3000}"
PULL=1
RESTART=1
for arg in "$@"; do
  case "$arg" in
    --no-pull) PULL=0 ;;
    --no-restart) RESTART=0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

cd "$(dirname "$0")/.."

if [ "$PULL" -eq 1 ]; then
  echo "==> git pull"
  git pull --ff-only
fi

echo "==> install dependencies"
pnpm install --frozen-lockfile

echo "==> build"
pnpm build

# The standalone build does not include public/ or the static assets: copy them.
echo "==> copy static files into the standalone build"
rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# Next copies any .env it finds into the build. Secrets must only live in /etc/pompasys.env.
rm -f .next/standalone/.env .next/standalone/.env.*

if [ "$RESTART" -eq 1 ]; then
  echo "==> restart $SERVICE"
  sudo systemctl restart "$SERVICE"

  echo "==> health check"
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/es"; then
      echo "OK: site is answering on port ${PORT}"
      exit 0
    fi
    sleep 1
  done
  echo "The site did not answer after restart. Check: journalctl -u ${SERVICE} -n 50 --no-pager" >&2
  exit 1
fi

echo "Build ready. Start the service with: sudo systemctl restart ${SERVICE}"
