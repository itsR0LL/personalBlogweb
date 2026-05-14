from fastapi import APIRouter, Body
import os
import re
import json
from typing import Any, Dict, Optional, Tuple

router = APIRouter()

CURRENT_API_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_API_DIR, "..", ".."))
NUMBER_FIELDS = [
    "backgroundBlurPx",
    "backgroundOverlayLight",
    "backgroundOverlayDark",
    "gradientIntensity",
    "gradientGlowBlurPx",
]


def get_config_path():
    possible_paths = [
        os.path.join(PROJECT_ROOT, "siteConfig.ts"),
        os.path.join(PROJECT_ROOT, "src", "siteConfig.ts"),
        os.path.join(os.path.dirname(CURRENT_API_DIR), "siteConfig.ts"),
    ]

    for path in possible_paths:
        if os.path.exists(path):
            return path

    print(f"[CONFIG] Warning: siteConfig.ts not found under Manager root: {PROJECT_ROOT}")
    return None


def dict_to_ts_string(data: Dict[str, Any], indent=2):
    lines = ["{"]
    for key, value in data.items():
        val = json.dumps(value, ensure_ascii=False)
        lines.append(f"{' ' * (indent + 2)}{key}: {val},")
    lines.append(" " * indent + "}")
    return "\n".join(lines)


def find_balanced_block(content: str, key: str, opener: str, closer: str) -> Optional[Tuple[int, int, str]]:
    match = re.search(rf"{key}\s*:\s*\{opener}", content)
    if not match:
        return None

    start = match.end() - 1
    depth = 0
    quote = None
    escape = False

    for index in range(start, len(content)):
        char = content[index]

        if quote:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == quote:
                quote = None
            continue

        if char in ("'", '"', "`"):
            quote = char
        elif char == opener:
            depth += 1
        elif char == closer:
            depth -= 1
            if depth == 0:
                return start, index + 1, content[start : index + 1]

    return None


def remove_property(content: str, key: str, start: int, end: int):
    prop_start = re.search(rf"{key}\s*:\s*", content)
    if not prop_start:
        return content

    final_end = end
    while final_end < len(content) and content[final_end].isspace():
        final_end += 1
    if final_end < len(content) and content[final_end] == ",":
        final_end += 1

    return content[: prop_start.start()] + content[final_end:]


def insert_root_property(content: str, key: str, value: str):
    match = re.search(r"\n\};\s*$", content)
    if not match:
        match = re.search(r"\};\s*$", content)
    if not match:
        return content

    return content[: match.start()] + f"\n  {key}: {value}," + content[match.start() :]


def extract_string_array(content: str, key: str):
    block = find_balanced_block(content, key, "[", "]")
    if not block:
        return None, content

    start, end, array_raw = block
    values = re.findall(r'["\']([^"\']*)["\']', array_raw)
    return values, remove_property(content, key, start, end)


def extract_object(content: str, key: str):
    block = find_balanced_block(content, key, "{", "}")
    if not block:
        return None, content

    start, end, object_raw = block
    result: Dict[str, Any] = {}

    for match in re.finditer(r"([a-zA-Z0-9_]+)\s*:\s*([\"'])([\s\S]*?)\2", object_raw):
        result[match.group(1)] = match.group(3).replace("\\n", "\n")

    for match in re.finditer(r"([a-zA-Z0-9_]+)\s*:\s*(true|false)", object_raw):
        result[match.group(1)] = match.group(2) == "true"

    for match in re.finditer(r"([a-zA-Z0-9_]+)\s*:\s*(-?\d+(?:\.\d+)?)", object_raw):
        raw = match.group(2)
        result[match.group(1)] = float(raw) if "." in raw else int(raw)

    if key == "gitalkConfig":
        admin_match = re.search(r"admin\s*:\s*\[([\s\S]*?)\]", object_raw)
        result["admin"] = (
            re.findall(r'["\']([^"\']*)["\']', admin_match.group(1)) if admin_match else []
        )

    return result, remove_property(content, key, start, end)


@router.get("/get")
def get_site_config():
    config_path = get_config_path()
    if not config_path:
        return {"success": False, "message": "siteConfig.ts not found"}

    try:
        with open(config_path, "r", encoding="utf-8") as file:
            content = file.read()

        parsed_config: Dict[str, Any] = {}
        root_content = content

        for dict_name in ["social", "gitalkConfig", "geminiConfig", "icpConfig"]:
            value, root_content = extract_object(root_content, dict_name)
            if value is not None:
                parsed_config[dict_name] = value

        for array_name in [
            "cloudMusicIds",
            "bgImages",
            "lightBgImages",
            "darkBgImages",
            "themeColors",
            "danmakuList",
        ]:
            value, root_content = extract_string_array(root_content, array_name)
            if value is not None:
                parsed_config[array_name] = value

        for bool_name in ["useGradient"]:
            bool_match = re.search(rf"{bool_name}\s*:\s*(true|false)", root_content)
            if bool_match:
                parsed_config[bool_name] = bool_match.group(1) == "true"
                root_content = re.sub(rf"{bool_name}\s*:\s*(true|false),?", "", root_content, count=1)

        for number_name in NUMBER_FIELDS:
            number_match = re.search(rf"{number_name}\s*:\s*(-?\d+(?:\.\d+)?)", root_content)
            if number_match:
                raw_number = number_match.group(1)
                parsed_config[number_name] = float(raw_number) if "." in raw_number else int(raw_number)
                root_content = re.sub(rf"{number_name}\s*:\s*(-?\d+(?:\.\d+)?),?", "", root_content, count=1)

        for match in re.finditer(r"([a-zA-Z0-9_]+)\s*:\s*([\"'])([\s\S]*?)\2", root_content):
            key, _, val = match.groups()
            parsed_config[key] = val.replace("\\n", "\n")

        return {"success": True, "data": parsed_config}
    except Exception as exc:
        return {"success": False, "message": f"Failed to parse config: {str(exc)}"}


@router.post("/update")
def update_site_config(payload: Dict[str, Any] = Body(...)):
    updates = payload.get("updates", {})
    if not updates:
        return {"success": False, "message": "No updates received"}

    config_path = get_config_path()
    if not config_path:
        return {"success": False, "message": "siteConfig.ts not found"}

    valid_root_keys = {
        "title",
        "authorName",
        "bio",
        "avatarUrl",
        "useGradient",
        "themeColors",
        "backgroundBlurPx",
        "backgroundOverlayLight",
        "backgroundOverlayDark",
        "gradientIntensity",
        "gradientGlowBlurPx",
        "bgImages",
        "lightBgImages",
        "darkBgImages",
        "defaultPostCover",
        "photoWallImage",
        "cloudMusicIds",
        "social",
        "counts",
        "chatterTitle",
        "chatterDescription",
        "picBedName",
        "picBedUrl",
        "picBedToken",
        "danmakuList",
        "gitalkConfig",
        "buildDate",
        "footerBadges",
        "icpConfig",
        "geminiConfig",
        "faviconUrl",
        "navTitle",
        "navSuffix",
        "navAfter",
    }

    try:
        with open(config_path, "r", encoding="utf-8") as file:
            content = file.read()

        updated_count = 0
        print("\n" + "=" * 50)
        print(f"[CONFIG] Start update, target file: {config_path}")

        for key, value in updates.items():
            if key not in valid_root_keys:
                print(f"  [CONFIG] Skip non-root or unsafe field -> [{key}]")
                continue

            if key == "gitalkConfig":
                admin_list = value.get("admin", [])
                if isinstance(admin_list, str):
                    admin_list = [admin_list]
                admin_str = '["' + '", "'.join(admin_list) + '"]'

                gitalk_ts_code = f"""{{
    clientID: {json.dumps(value.get("clientID", ""), ensure_ascii=False)},
    clientSecret: {json.dumps(value.get("clientSecret", ""), ensure_ascii=False)},
    repo: {json.dumps(value.get("repo", ""), ensure_ascii=False)},
    owner: {json.dumps(value.get("owner", ""), ensure_ascii=False)},
    admin: {admin_str},
  }}"""
                pattern = rf"({key}\s*:\s*)\{{[\s\S]*?\}}"
                if re.search(pattern, content):
                    content = re.sub(pattern, lambda match: match.group(1) + gitalk_ts_code, content, count=1)
                    updated_count += 1
                    print(f"  [CONFIG] Updated special field -> [{key}]")
                continue

            if isinstance(value, str):
                val_str = json.dumps(value, ensure_ascii=False)
            elif isinstance(value, bool):
                val_str = str(value).lower()
            elif isinstance(value, dict):
                val_str = dict_to_ts_string(value, indent=2)
            else:
                val_str = json.dumps(value, ensure_ascii=False)

            if isinstance(value, dict):
                pattern = rf"({key}\s*:\s*)\{{[\s\S]*?\}}"
            elif isinstance(value, list):
                pattern = rf"({key}\s*:\s*)\[[\s\S]*?\]"
            else:
                pattern = rf"({key}\s*:\s*)(['\"`][\s\S]*?['\"`]|true|false|-?\d+(?:\.\d+)?)"

            if re.search(pattern, content):
                content = re.sub(pattern, lambda match: match.group(1) + val_str, content, count=1)
                updated_count += 1
                print(f"  [CONFIG] Updated field -> [{key}]")
            else:
                next_content = insert_root_property(content, key, val_str)
                if next_content != content:
                    content = next_content
                    updated_count += 1
                    print(f"  [CONFIG] Inserted field -> [{key}]")

        with open(config_path, "w", encoding="utf-8") as file:
            file.write(content)

        print(f"[CONFIG] Update complete, refreshed {updated_count} fields")
        print("=" * 50 + "\n")

        return {"success": True, "message": "siteConfig.ts updated successfully"}
    except Exception as exc:
        print(f"[CONFIG] Update failed: {str(exc)}")
        return {"success": False, "message": f"Failed to update config: {str(exc)}"}
