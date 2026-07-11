# Comments Service

The public blog has two active comment channels:

- `music`: one public stream. Every submission includes the selected song ID,
  title, and artist, which are shown as secondary text on the comment.
- `guestbook`: the guestbook rendered on `/about`.

Article, chatter, moment, and friends-page placeholders remain read-only.

## State Flow

New submissions are stored immediately with `pending` status. The public API
only returns `approved` rows. The local manager can later change a row to:

- `approved`: visible on the public blog.
- `rejected`: retained for moderation history and not public.
- `deleted`: soft-deleted and not public.
- `pending`: restored to the review queue.

The manager does not need to stay online. It reads pending rows from the server
database whenever `/comments` opens, regains focus, or is manually refreshed.

## Runtime Layout

```text
personalblogweb container
  /api/comments/*
      |
      | internal Docker network + COMMENTS_SERVICE_TOKEN
      v
personalblog-comments container (no host port)
  /data/comments.db
      |
      v
/srv/personalblogweb/shared/comments/comments.db
```

The browser never receives `COMMENTS_SERVICE_TOKEN` or
`COMMENTS_ADMIN_TOKEN`. Public submissions are validated by Cloudflare
Turnstile on the server before they reach the comments service.

## Server Configuration

Create a Turnstile widget for `r0l1dehome.asia`, then add these values to:

```text
/srv/personalblogweb/shared/.env.production
```

```text
COMMENTS_SERVICE_TOKEN=<random-long-secret>
COMMENTS_ADMIN_TOKEN=<different-random-long-secret>
COMMENTS_HASH_SECRET=<different-random-long-secret>
TURNSTILE_SITE_KEY=<cloudflare-site-key>
TURNSTILE_SECRET_KEY=<cloudflare-secret-key>
TURNSTILE_EXPECTED_HOSTNAME=r0l1dehome.asia
```

Optional rate-limit overrides:

```text
COMMENTS_RATE_LIMIT_WINDOW_SECONDS=600
COMMENTS_RATE_LIMIT_MAX_SUBMISSIONS=3
COMMENTS_RATE_LIMIT_MIN_INTERVAL_SECONDS=20
```

`TURNSTILE_SITE_KEY` is public by design but remains a runtime server value so
the standalone image does not need to be rebuilt when it changes.

After deployment, open the local manager settings page and save:

```text
Comments admin URL: https://r0l1dehome.asia/api/comments/admin
Comments admin token: the COMMENTS_ADMIN_TOKEN value
```

The token is stored in `my-blog-manager/manager_data/runtime_config.json` and
is not returned to the browser after saving.

## Backup

Create a consistent backup while the service remains online:

```bash
sudo mkdir -p /srv/personalblogweb/backups/comments
sudo python3 - <<'PY'
import datetime
import pathlib
import sqlite3

source = pathlib.Path('/srv/personalblogweb/shared/comments/comments.db')
stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
target = pathlib.Path('/srv/personalblogweb/backups/comments') / f'comments-{stamp}.db'
with sqlite3.connect(source) as source_db, sqlite3.connect(target) as backup_db:
    source_db.backup(backup_db)
print(target)
PY
```

Restore requires stopping both containers before replacing the database:

```bash
cd /srv/personalblogweb/current
sudo docker compose -f deploy/docker-compose.server.yml stop personalblogweb comments
sudo cp /srv/personalblogweb/backups/comments/comments-YYYYMMDD-HHMMSS.db \
  /srv/personalblogweb/shared/comments/comments.db
sudo chown 10002:10002 /srv/personalblogweb/shared/comments/comments.db
sudo docker compose -f deploy/docker-compose.server.yml up -d comments personalblogweb
```

## Verification

```bash
sudo docker compose -f deploy/docker-compose.server.yml ps
sudo docker exec personalblog-comments python -c \
  "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8080/healthz').read().decode())"
curl -s 'https://r0l1dehome.asia/api/comments?channel=guestbook&page=1&pageSize=20'
curl -s 'https://r0l1dehome.asia/api/comments/config'
```
