import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", ".next", "node_modules", "manager_data", ".vercel"}
SKIP_FILES = {"package-lock.json", "backend_config.json"}

PATTERNS = [
    ("picBedToken literal", re.compile(r"(?<!['\"])\bpicBedToken\s*:\s*['\"][^'\"\s][^'\"]+['\"]")),
    ("Gitalk client secret literal", re.compile(r"(?<!['\"])\bclientSecret\s*:\s*['\"][^'\"\s][^'\"]{8,}['\"]")),
]


def should_skip(path: Path) -> bool:
    if path.name in SKIP_FILES:
        return True
    return any(part in SKIP_DIRS for part in path.parts)


def main() -> int:
    findings: list[str] = []
    for path in ROOT.rglob("*"):
        relative = path.relative_to(ROOT)
        if not path.is_file() or should_skip(relative):
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for label, pattern in PATTERNS:
            for match in pattern.finditer(text):
                line = text.count("\n", 0, match.start()) + 1
                findings.append(f"{relative}:{line}: {label}")

    if findings:
        print("Secret scan failed:")
        for finding in findings:
            print(f"  {finding}")
        return 1
    print("Secret scan passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
