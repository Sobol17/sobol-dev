#!/usr/bin/env bash
set -euo pipefail
umask 0077
set -a
# The installer creates this trusted environment file outside the release directory.
# shellcheck disable=SC1090
source "$1"
set +a
export DATABASE_FILE="$2/var/build.db"
cd -- "$2"
pnpm install --frozen-lockfile
pnpm build
