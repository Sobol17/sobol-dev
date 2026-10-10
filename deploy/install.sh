#!/usr/bin/env bash
set -euo pipefail
umask 0077
[[ $(id -u) == 0 ]] || { echo 'run with sudo' >&2; exit 1; }
domain=${1:?usage: sudo bash deploy/install.sh example.com}
[[ $domain =~ ^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$ ]] || {
    echo 'a public hostname is required' >&2; exit 1;
}
[[ $(node -p 'process.versions.node.split(".")[0]') == 22 ]] || { echo 'Node 22 required' >&2; exit 1; }
for tool in pnpm caddy curl openssl flock runuser; do command -v "$tool" >/dev/null; done
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
if [[ -e /etc/agency-site/app.env ]] && ! grep -Fxq "PUBLIC_SITE_URL=https://$domain" /etc/agency-site/app.env; then
    echo 'existing site address differs; update the environment and rebuild before changing domains' >&2
    exit 1
fi

if ! id agency-site >/dev/null 2>&1; then
    useradd --system --user-group --home-dir /var/lib/agency-site --shell /usr/sbin/nologin agency-site
fi
install -d -m 0750 -o root -g agency-site /srv/agency-site /srv/agency-site/releases
install -d -m 0700 -o agency-site -g agency-site /var/lib/agency-site /var/lib/agency-site/backups
for file in /var/lib/agency-site/app.db /var/lib/agency-site/app.db-wal /var/lib/agency-site/app.db-shm; do
    if [[ -f "$file" ]]; then chown agency-site:agency-site "$file"; chmod 0600 "$file"; fi
done
install -d -m 0750 -o root -g agency-site /etc/agency-site
if [[ ! -e /etc/agency-site/app.env ]]; then
    {
        printf 'DATABASE_FILE=/var/lib/agency-site/app.db\nPUBLIC_SITE_URL=https://%s\nORIGIN=https://%s\n' "$domain" "$domain"
        printf 'SESSION_SECRET=%s\nIP_HASH_SALT=%s\n' "$(openssl rand -hex 32)" "$(openssl rand -hex 32)"
        printf 'NODE_ENV=production\nHOST=127.0.0.1\nPORT=3000\nADDRESS_HEADER=x-forwarded-for\nXFF_DEPTH=1\nSHUTDOWN_TIMEOUT=30\n'
    } > /etc/agency-site/app.env
    chown root:agency-site /etc/agency-site/app.env
    chmod 0640 /etc/agency-site/app.env
fi
for unit in agency-site.service agency-site-backup.service agency-site-backup.timer; do
    install -m 0644 "$script_dir/$unit" "/etc/systemd/system/$unit"
done
install -d -m 0755 /etc/caddy/sites
sed "s/example.com/$domain/g" "$script_dir/Caddyfile" > /etc/caddy/sites/agency-site.caddy
chmod 0644 /etc/caddy/sites/agency-site.caddy
if ! grep -Fxq 'import sites/*.caddy' /etc/caddy/Caddyfile; then
    cp -p /etc/caddy/Caddyfile /etc/caddy/Caddyfile.before-agency-site
    printf '\nimport sites/*.caddy\n' >> /etc/caddy/Caddyfile
fi
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl daemon-reload
systemctl enable agency-site
systemctl enable agency-site-backup.timer
systemctl reload caddy
echo 'service files installed; run deploy/deploy.sh to build the first release'
