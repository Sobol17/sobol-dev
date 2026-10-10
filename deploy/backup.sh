#!/usr/bin/env bash
set -euo pipefail
umask 0077
set -a
# The installer creates this trusted environment file outside the release directory.
# shellcheck disable=SC1090
source "$1"
set +a
cd -- "$2"
pnpm exec tsx scripts/backup.ts "$3"
