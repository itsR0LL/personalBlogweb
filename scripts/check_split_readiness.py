from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANAGER = ROOT / "my-blog-manager"

SKIP_DIRS = {
    ".git",
    ".next",
    "node_modules",
    "manager_data",
    "__pycache__",
}

SKIP_FILES = {
    MANAGER / "data" / "deploy_config.json",
    MANAGER / "public" / "backend_config.json",
}

TEXT_EXTENSIONS = {
    ".bat",
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".py",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml",
}

FORBIDDEN_MANAGER_LITERALS = [
    "E:/Project/personalBlogweb",
    "E:\\Project\\personalBlogweb",
    "E:\\\\Project\\\\personalBlogweb",
]


def fail(message: str, failures: list[str]) -> None:
    failures.append(message)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def is_skipped(path: Path) -> bool:
    if path in SKIP_FILES:
        return True
    return any(part in SKIP_DIRS for part in path.relative_to(ROOT).parts)


def git_ls_files(path: str) -> str:
    result = subprocess.run(
        ["git", "ls-files", path],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    return result.stdout.strip()


def check_root_boundaries(failures: list[str]) -> None:
    tsconfig = json.loads(read_text(ROOT / "tsconfig.json"))
    excludes = tsconfig.get("exclude", [])
    if "my-blog-manager" not in excludes and "my-blog-manager/" not in excludes:
        fail("Root tsconfig.json must exclude my-blog-manager.", failures)

    if git_ls_files("my-blog-manager/public/backend_config.json"):
        fail("my-blog-manager/public/backend_config.json is still tracked by Git.", failures)


def check_manager_literals(failures: list[str]) -> None:
    for path in MANAGER.rglob("*"):
        if not path.is_file() or is_skipped(path):
            continue
        if path.suffix.lower() not in TEXT_EXTENSIONS:
            continue

        content = read_text(path)
        for literal in FORBIDDEN_MANAGER_LITERALS:
            if literal in content:
                fail(f"Hard-coded public blog path found in {path.relative_to(ROOT)}", failures)


def main() -> int:
    failures: list[str] = []
    check_root_boundaries(failures)
    check_manager_literals(failures)

    if failures:
        print("Split readiness check failed:")
        for item in failures:
            print(f"- {item}")
        return 1

    print("Split readiness check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
