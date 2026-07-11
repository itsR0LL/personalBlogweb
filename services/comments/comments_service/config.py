from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import os


@dataclass(frozen=True)
class Settings:
    data_dir: Path
    database_path: Path
    service_token: str
    hash_secret: str
    rate_limit_window_seconds: int
    rate_limit_max_submissions: int
    rate_limit_min_interval_seconds: int


def _positive_int(name: str, fallback: int) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return fallback
    value = int(raw)
    if value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return value


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    data_dir = Path(os.environ.get("COMMENTS_DATA_DIR", "/data")).resolve()
    return Settings(
        data_dir=data_dir,
        database_path=data_dir / "comments.db",
        service_token=os.environ.get("COMMENTS_SERVICE_TOKEN", "").strip(),
        hash_secret=os.environ.get("COMMENTS_HASH_SECRET", "").strip(),
        rate_limit_window_seconds=_positive_int("COMMENTS_RATE_LIMIT_WINDOW_SECONDS", 600),
        rate_limit_max_submissions=_positive_int("COMMENTS_RATE_LIMIT_MAX_SUBMISSIONS", 3),
        rate_limit_min_interval_seconds=_positive_int("COMMENTS_RATE_LIMIT_MIN_INTERVAL_SECONDS", 20),
    )
