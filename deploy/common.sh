#!/usr/bin/env bash

app_root=${AGENCY_SITE_ROOT:-/srv/agency-site}
data_dir=${AGENCY_DATA_DIR:-/var/lib/agency-site}
env_file=${AGENCY_ENV_FILE:-/etc/agency-site/app.env}
service_user=agency-site

require_environment() {
    [[ $(id -u) == 0 ]] || { echo 'run with sudo' >&2; exit 1; }
    [[ -r "$env_file" ]] || { echo 'install the service environment first' >&2; exit 1; }
    [[ $(node -p 'process.versions.node.split(".")[0]') == 22 ]] || { echo 'Node 22 required' >&2; exit 1; }
    exec 9>"$data_dir/deploy.lock"
    flock -n 9 || { echo 'another deployment is running' >&2; exit 1; }
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
    [[ $DATABASE_FILE == "$data_dir/app.db" && $HOST == 127.0.0.1 && $PORT == 3000 ]] || {
        echo 'database path or listener differs from the service configuration' >&2; exit 1;
    }
    [[ $ORIGIN == "$PUBLIC_SITE_URL" && $ORIGIN == https://* ]] || {
        echo 'ORIGIN must match the HTTPS site address' >&2; exit 1;
    }
}

switch_link() {
    ln -sfn "$1" "$app_root/.current.next"
    node -e 'require("node:fs").renameSync(process.argv[1], process.argv[2])' \
        "$app_root/.current.next" "$app_root/current"
}

wait_for_health() {
    local attempt
    for attempt in {1..30}; do
        if curl --silent --show-error --fail --max-time 2 http://127.0.0.1:3000/healthz |
            grep -Eq '"status"[[:space:]]*:[[:space:]]*"ok"'; then
            return 0
        fi
        sleep 1
    done
    return 1
}

backup_database() {
    [[ -f "$DATABASE_FILE" ]] || return 0
    runuser -u "$service_user" -- bash -c \
        'set -a; source "$1"; set +a; cd "$2"; pnpm exec tsx scripts/backup.ts "$3"' \
        bash "$env_file" "$1" "$data_dir/backups"
}

activate_release() {
    local target=$1 previous=$2
    switch_link "$target"
    if systemctl restart agency-site && wait_for_health; then
        return 0
    fi
    echo 'release failed its health check' >&2
    if [[ -n "$previous" ]]; then
        switch_link "$previous"
        if systemctl restart agency-site && wait_for_health; then
            echo 'previous release restored' >&2
        else
            echo 'previous release also failed; inspect journalctl -u agency-site' >&2
        fi
    else
        systemctl stop agency-site
        rm -f "$app_root/current"
    fi
    return 1
}
