import hashlib
import hmac
import math
import sqlite3
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from .config import Settings
from .models import AdminCommentUpdate, PublicCommentCreate


class CommentServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def _connect(settings: Settings) -> sqlite3.Connection:
    connection = sqlite3.connect(settings.database_path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA journal_mode = WAL")
    return connection


def _now() -> tuple[str, int]:
    current = datetime.now(timezone.utc)
    return current.isoformat(timespec="seconds"), int(current.timestamp())


def _digest(settings: Settings, namespace: str, value: str) -> str:
    if not settings.hash_secret:
        raise CommentServiceError("COMMENTS_HASH_SECRET is not configured", 503)
    payload = f"{namespace}:{value}".encode("utf-8")
    return hmac.new(settings.hash_secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()


def init_db(settings: Settings) -> None:
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    with _connect(settings) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS comments (
              id TEXT PRIMARY KEY,
              channel TEXT NOT NULL CHECK (channel IN ('music', 'guestbook')),
              author_name TEXT NOT NULL,
              content TEXT NOT NULL,
              song_id TEXT,
              song_title TEXT,
              song_artist TEXT,
              status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'deleted')),
              reply TEXT,
              created_at TEXT NOT NULL,
              created_at_epoch INTEGER NOT NULL,
              updated_at TEXT NOT NULL,
              reviewed_at TEXT,
              deleted_at TEXT,
              ip_hash TEXT NOT NULL,
              user_agent_hash TEXT NOT NULL
            )
            """
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_comments_public ON comments(channel, status, created_at_epoch DESC)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_comments_admin ON comments(status, created_at_epoch DESC)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_comments_rate_limit ON comments(ip_hash, created_at_epoch DESC)"
        )
        connection.commit()


def _to_comment(row: sqlite3.Row | dict[str, Any]) -> dict[str, Any]:
    record = dict(row)
    song = None
    if record.get("song_id"):
        song = {
            "id": record["song_id"],
            "title": record["song_title"],
            "artist": record["song_artist"],
        }
    return {
        "id": record["id"],
        "channel": record["channel"],
        "authorName": record["author_name"],
        "content": record["content"],
        "song": song,
        "status": record["status"],
        "reply": record.get("reply"),
        "createdAt": record["created_at"],
        "updatedAt": record["updated_at"],
        "reviewedAt": record.get("reviewed_at"),
        "deletedAt": record.get("deleted_at"),
    }


def _enforce_rate_limit(settings: Settings, connection: sqlite3.Connection, ip_hash: str, now_epoch: int) -> None:
    latest = connection.execute(
        "SELECT created_at_epoch FROM comments WHERE ip_hash = ? ORDER BY created_at_epoch DESC LIMIT 1",
        (ip_hash,),
    ).fetchone()
    if latest and now_epoch - latest["created_at_epoch"] < settings.rate_limit_min_interval_seconds:
        raise CommentServiceError("提交过于频繁，请稍后再试", 429)

    window_start = now_epoch - settings.rate_limit_window_seconds
    count = connection.execute(
        "SELECT COUNT(*) FROM comments WHERE ip_hash = ? AND created_at_epoch >= ?",
        (ip_hash, window_start),
    ).fetchone()[0]
    if count >= settings.rate_limit_max_submissions:
        raise CommentServiceError("留言次数已达到当前时间段上限，请稍后再试", 429)


def create_comment(
    settings: Settings,
    payload: PublicCommentCreate,
    visitor_ip: str,
    user_agent: str,
) -> dict[str, Any]:
    ip_hash = _digest(settings, "ip", visitor_ip or "unknown")
    user_agent_hash = _digest(settings, "ua", user_agent or "unknown")
    now_iso, now_epoch = _now()
    song = payload.song
    record = {
        "id": str(uuid4()),
        "channel": payload.channel,
        "author_name": payload.authorName,
        "content": payload.content,
        "song_id": song.id if song else None,
        "song_title": song.title if song else None,
        "song_artist": song.artist if song else None,
        "status": "pending",
        "reply": None,
        "created_at": now_iso,
        "created_at_epoch": now_epoch,
        "updated_at": now_iso,
        "reviewed_at": None,
        "deleted_at": None,
        "ip_hash": ip_hash,
        "user_agent_hash": user_agent_hash,
    }
    fields = list(record.keys())

    with _connect(settings) as connection:
        connection.execute("BEGIN IMMEDIATE")
        _enforce_rate_limit(settings, connection, ip_hash, now_epoch)
        connection.execute(
            f"INSERT INTO comments ({', '.join(fields)}) VALUES ({', '.join('?' for _ in fields)})",
            [record[field] for field in fields],
        )
        connection.commit()
        row = connection.execute("SELECT * FROM comments WHERE id = ?", (record["id"],)).fetchone()
    return _to_comment(row)


def list_public_comments(
    settings: Settings,
    channel: str,
    page: int,
    page_size: int,
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    offset = (page - 1) * page_size
    with _connect(settings) as connection:
        total = connection.execute(
            "SELECT COUNT(*) FROM comments WHERE channel = ? AND status = 'approved'",
            (channel,),
        ).fetchone()[0]
        rows = connection.execute(
            """
            SELECT * FROM comments
            WHERE channel = ? AND status = 'approved'
            ORDER BY created_at_epoch DESC
            LIMIT ? OFFSET ?
            """,
            (channel, page_size, offset),
        ).fetchall()
    return [_to_comment(row) for row in rows], {
        "currentPage": page,
        "lastPage": max(1, math.ceil(total / page_size)) if total else 1,
        "total": total,
        "pageSize": page_size,
    }


def list_admin_comments(
    settings: Settings,
    page: int,
    page_size: int,
    channel: str = "",
    status: str = "",
    query: str = "",
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    where = ["1 = 1"]
    params: list[Any] = []
    if channel:
        where.append("channel = ?")
        params.append(channel)
    if status:
        where.append("status = ?")
        params.append(status)
    if query:
        where.append("(author_name LIKE ? OR content LIKE ? OR song_title LIKE ? OR song_artist LIKE ?)")
        like_query = f"%{query}%"
        params.extend([like_query, like_query, like_query, like_query])
    where_sql = " AND ".join(where)
    offset = (page - 1) * page_size
    with _connect(settings) as connection:
        total = connection.execute(
            f"SELECT COUNT(*) FROM comments WHERE {where_sql}", params
        ).fetchone()[0]
        rows = connection.execute(
            f"""
            SELECT * FROM comments
            WHERE {where_sql}
            ORDER BY created_at_epoch DESC
            LIMIT ? OFFSET ?
            """,
            [*params, page_size, offset],
        ).fetchall()
    return [_to_comment(row) for row in rows], {
        "currentPage": page,
        "lastPage": max(1, math.ceil(total / page_size)) if total else 1,
        "total": total,
        "pageSize": page_size,
    }


def update_comment(settings: Settings, comment_id: str, payload: AdminCommentUpdate) -> dict[str, Any]:
    now_iso, _ = _now()
    updates: list[str] = ["updated_at = ?"]
    params: list[Any] = [now_iso]

    if "status" in payload.model_fields_set and payload.status:
        updates.extend(["status = ?", "reviewed_at = ?", "deleted_at = ?"])
        params.extend([
            payload.status,
            now_iso,
            now_iso if payload.status == "deleted" else None,
        ])
    if "reply" in payload.model_fields_set:
        updates.append("reply = ?")
        params.append(payload.reply)
    params.append(comment_id)

    with _connect(settings) as connection:
        cursor = connection.execute(
            f"UPDATE comments SET {', '.join(updates)} WHERE id = ?",
            params,
        )
        connection.commit()
        if cursor.rowcount == 0:
            raise CommentServiceError("留言不存在", 404)
        row = connection.execute("SELECT * FROM comments WHERE id = ?", (comment_id,)).fetchone()
    return _to_comment(row)


def soft_delete_comment(settings: Settings, comment_id: str) -> dict[str, Any]:
    return update_comment(settings, comment_id, AdminCommentUpdate(status="deleted"))


def comment_stats(settings: Settings) -> dict[str, Any]:
    with _connect(settings) as connection:
        status_rows = connection.execute(
            "SELECT status, COUNT(*) AS total FROM comments GROUP BY status"
        ).fetchall()
        channel_rows = connection.execute(
            "SELECT channel, COUNT(*) AS total FROM comments GROUP BY channel"
        ).fetchall()
    statuses = {row["status"]: row["total"] for row in status_rows}
    channels = {row["channel"]: row["total"] for row in channel_rows}
    return {
        "statuses": {
            "pending": statuses.get("pending", 0),
            "approved": statuses.get("approved", 0),
            "rejected": statuses.get("rejected", 0),
            "deleted": statuses.get("deleted", 0),
        },
        "channels": {
            "music": channels.get("music", 0),
            "guestbook": channels.get("guestbook", 0),
        },
    }
