#!/usr/bin/env bash
set -euo pipefail
umask 0077
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# shellcheck source=deploy/common.sh
source "$script_dir/common.sh"
require_environment

target=$(readlink "$app_root/previous" || true)
[[ $target == "$app_root/releases/"* && -f "$target/build/index.js" ]] || {
    echo 'no previous release is available' >&2; exit 1;
}
current=$(readlink "$app_root/current" || true)
[[ -n "$current" ]] || { echo 'no active release is available' >&2; exit 1; }
backup_database "$current"
if activate_release "$target" "$current"; then
    ln -sfn "$current" "$app_root/previous"
    echo 'previous release activated; database unchanged'
else
    exit 1
fi
