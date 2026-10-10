#!/usr/bin/env bash
set -euo pipefail
umask 0077
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=deploy/common.sh
source "$script_dir/common.sh"
require_environment

source_root=$(cd -- "$script_dir/.." && pwd)
source_dir=$(git -c safe.directory="$source_root" -C "$source_root" rev-parse --show-toplevel)
git -c safe.directory="$source_dir" -C "$source_dir" diff --quiet
git -c safe.directory="$source_dir" -C "$source_dir" diff --cached --quiet
commit=$(git -c safe.directory="$source_dir" -C "$source_dir" rev-parse HEAD)
release=$(mktemp -d "$app_root/releases/${commit:0:12}.XXXXXX")
git -c safe.directory="$source_dir" -C "$source_dir" archive HEAD | tar -x -C "$release"
chown -R "$service_user:$service_user" "$release"

# Build against a disposable database while the old process serves the persistent database.
runuser -u "$service_user" -- bash "$release/deploy/build.sh" "$env_file" "$release"
[[ -f "$release/build/index.js" ]] || { echo 'build output is missing' >&2; exit 1; }
backup_database "$release"
previous=$(readlink "$app_root/current" || true)
if activate_release "$release" "$previous"; then
    if [[ -n "$previous" ]]; then ln -sfn "$previous" "$app_root/previous"; fi
    systemctl start agency-site-backup.timer
    echo "deployed commit $commit"
else
    exit 1
fi
