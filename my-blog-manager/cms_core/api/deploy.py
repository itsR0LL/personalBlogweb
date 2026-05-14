import json
import os
import platform
import re
import subprocess
import getpass
from typing import Optional, Tuple

from fastapi import APIRouter, Request

router = APIRouter()

CURRENT_API_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_API_DIR, "..", ".."))
CONFIG_FILE = os.path.join(PROJECT_ROOT, "data", "deploy_config.json")

PUBLIC_SITE_STAGE_PATHS = [
    ".vercelignore",
    "app",
    "chatters",
    "components",
    "data",
    "eslint.config.mjs",
    "moments",
    "next.config.ts",
    "package-lock.json",
    "package.json",
    "postcss.config.mjs",
    "posts",
    "public",
    "siteConfig.ts",
    "tsconfig.json",
]


def npm_command(*args: str) -> list[str]:
    if os.name == "nt":
        return ["cmd", "/c", "npm", *args]
    return ["npm", *args]


def run_command(
    command: list[str],
    cwd: str,
    env: Optional[dict[str, str]] = None,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=cwd,
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        shell=False,
    )


def resolve_blog_path(raw_path: str) -> Tuple[Optional[str], Optional[str]]:
    cleaned_path = (raw_path or "").strip()
    if not cleaned_path:
        return None, "本地博客路径不能为空。"
    blog_path = os.path.abspath(os.path.expanduser(cleaned_path))
    if not os.path.isdir(blog_path):
        return None, "本地博客路径不存在，请先检查路径。"
    if not os.path.isfile(os.path.join(blog_path, "package.json")):
        return None, "目标路径不是有效的 Next.js 项目，未找到 package.json。"
    return blog_path, None


def is_safe_git_ref(value: str) -> bool:
    return bool(re.fullmatch(r"[A-Za-z0-9._/-]+", value or ""))


def default_deploy_config() -> dict:
    return {
        "blogPath": "",
        "staticRepoUrl": "",
        "staticBranch": "gh-pages",
        "sourceRepoUrl": "",
        "sourceBranch": "main",
    }


def load_deploy_config() -> dict:
    config = default_deploy_config()
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                loaded = json.load(f)
            if isinstance(loaded, dict):
                config.update({key: loaded.get(key, value) for key, value in config.items()})
        except Exception:
            pass
    return config


def get_git_value(blog_path: str, command: list[str]) -> str:
    process = run_command(command, cwd=blog_path)
    if process.returncode != 0:
        return ""
    return process.stdout.strip()


@router.get("/config")
async def get_deploy_config():
    return load_deploy_config()


@router.get("/status")
async def get_deploy_status():
    config = load_deploy_config()
    blog_path, path_error = resolve_blog_path(config.get("blogPath", ""))
    git_available = bool(blog_path and os.path.exists(os.path.join(blog_path, ".git")))
    current_branch = ""
    origin_url = ""

    if git_available and blog_path:
        current_branch = get_git_value(blog_path, ["git", "rev-parse", "--abbrev-ref", "HEAD"])
        origin_url = get_git_value(blog_path, ["git", "remote", "get-url", "origin"])

    vercel_project = {}
    if blog_path:
        vercel_project_path = os.path.join(blog_path, ".vercel", "project.json")
        if os.path.exists(vercel_project_path):
            try:
                with open(vercel_project_path, "r", encoding="utf-8") as f:
                    raw_vercel_project = json.load(f)
                if isinstance(raw_vercel_project, dict):
                    vercel_project = {"projectName": raw_vercel_project.get("projectName", "")}
            except Exception:
                vercel_project = {}

    source_repo = (config.get("sourceRepoUrl") or "").strip()
    resolved_source_repo = origin_url if source_repo == "origin" else source_repo
    source_branch = (config.get("sourceBranch") or "main").strip()
    static_repo = (config.get("staticRepoUrl") or "").strip()

    return {
        "success": True,
        "config": {
            "blogPath": config.get("blogPath", ""),
            "sourceRepoUrl": source_repo,
            "sourceRepoResolvedUrl": resolved_source_repo,
            "sourceBranch": source_branch,
            "staticRepoUrl": static_repo,
            "staticBranch": config.get("staticBranch", "gh-pages"),
        },
        "path": {
            "valid": path_error is None,
            "message": path_error or "路径校验通过",
        },
        "git": {
            "available": git_available,
            "currentBranch": current_branch,
            "originUrl": origin_url,
        },
        "vercel": {
            "linked": bool(vercel_project.get("projectName")),
            "projectName": vercel_project.get("projectName", ""),
        },
        "deployment": {
            "staticEnabled": bool(static_repo),
            "sourceEnabled": bool(source_repo and source_branch),
        },
        "safety": {
            "managerExcluded": "my-blog-manager" not in PUBLIC_SITE_STAGE_PATHS,
            "secretFilesExcluded": True,
            "sourceSyncMode": "public-site-only",
        },
    }


@router.post("/config")
async def save_deploy_config(request: Request):
    try:
        data = await request.json()
        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return {"success": True, "message": "部署配置已保存。"}
    except Exception as e:
        return {"success": False, "message": f"保存失败: {str(e)}"}


@router.get("/ssh/key")
async def get_my_ssh_key(type: str = "static"):
    """Return or create the local SSH public key for the selected deploy target."""
    try:
        if type not in {"static", "source"}:
            return {"success": False, "message": "不支持的密钥类型。"}

        ssh_dir = os.path.expanduser("~/.ssh")
        os.makedirs(ssh_dir, exist_ok=True)

        if type == "source":
            key_name = "id_ed25519_source"
            user_tag = f"{getpass.getuser()}@{platform.node()}-Source"
        else:
            key_name = "id_ed25519"
            user_tag = f"{getpass.getuser()}@{platform.node()}-Static"

        pub_key_path = os.path.join(ssh_dir, f"{key_name}.pub")
        priv_key_path = os.path.join(ssh_dir, key_name)

        if type == "static" and not os.path.exists(pub_key_path):
            legacy_pub_key = os.path.join(ssh_dir, "id_rsa.pub")
            if os.path.exists(legacy_pub_key):
                pub_key_path = legacy_pub_key

        if not os.path.exists(pub_key_path):
            run_command(
                [
                    "ssh-keygen",
                    "-t",
                    "ed25519",
                    "-C",
                    user_tag,
                    "-N",
                    "",
                    "-f",
                    priv_key_path,
                ],
                cwd=PROJECT_ROOT,
            ).check_returncode()
            pub_key_path = f"{priv_key_path}.pub"

        if type == "source":
            config_path = os.path.join(ssh_dir, "config")
            safe_priv_path = priv_key_path.replace("\\", "/")
            config_entry = (
                "\n# Auto-generated by Blog Manager for source deployment\n"
                "Host github-source\n"
                "    HostName github.com\n"
                "    User git\n"
                f"    IdentityFile {safe_priv_path}\n"
            )

            config_exists = False
            if os.path.exists(config_path):
                with open(config_path, "r", encoding="utf-8") as f:
                    config_exists = "Host github-source" in f.read()

            if not config_exists:
                with open(config_path, "a", encoding="utf-8") as f:
                    f.write(config_entry)

        with open(pub_key_path, "r", encoding="utf-8") as f:
            return {"success": True, "key": f.read().strip()}

    except Exception as e:
        return {"success": False, "message": f"获取 SSH 公钥失败: {str(e)}"}


@router.post("/check")
async def check_git_env(request: Request):
    try:
        payload = await request.json()
        blog_path, error = resolve_blog_path(payload.get("blogPath", ""))
        if error:
            return {"success": False, "message": error}

        git_dir = os.path.join(blog_path, ".git")
        if not os.path.exists(git_dir):
            return {"success": False, "message": "该路径尚未初始化 Git 仓库，请先初始化部署环境。"}

        return {"success": True, "message": "Git 环境可用。"}
    except Exception as e:
        return {"success": False, "message": f"Git 检测失败: {str(e)}"}


@router.post("/init")
async def init_deploy_env(request: Request):
    """Initialize the target blog repository for static deployment."""
    try:
        payload = await request.json()
        blog_path, error = resolve_blog_path(payload.get("blogPath", ""))
        if error:
            return {"success": False, "message": error}

        static_repo = payload.get("staticRepoUrl", "").strip()

        run_command(["git", "init"], cwd=blog_path).check_returncode()

        if static_repo:
            run_command(["git", "remote", "remove", "origin"], cwd=blog_path)
            run_command(["git", "remote", "add", "origin", static_repo], cwd=blog_path).check_returncode()

        pkg_path = os.path.join(blog_path, "package.json")
        with open(pkg_path, "r", encoding="utf-8") as f:
            pkg_data = json.load(f)
        pkg_data.setdefault("scripts", {})
        pkg_data["scripts"]["deploy"] = "next build && gh-pages -d out"
        with open(pkg_path, "w", encoding="utf-8") as f:
            json.dump(pkg_data, f, indent=2, ensure_ascii=False)

        process = run_command(npm_command("install", "gh-pages", "--save-dev"), cwd=blog_path)
        if process.returncode != 0:
            return {"success": False, "message": f"安装 gh-pages 失败:\n{process.stderr}"}

        return {"success": True, "message": "部署环境初始化完成。"}
    except Exception as e:
        return {"success": False, "message": f"初始化失败: {str(e)}"}


@router.post("/publish")
async def publish_to_github_pages(request: Request):
    try:
        payload = await request.json()
        blog_path, error = resolve_blog_path(payload.get("blogPath", ""))
        if error:
            return {"success": False, "message": error}

        process = run_command(npm_command("run", "deploy"), cwd=blog_path)
        if process.returncode == 0:
            return {"success": True, "message": "静态站点已编译并发布。"}
        return {"success": False, "message": f"发布失败:\n{process.stderr}"}
    except Exception as e:
        return {"success": False, "message": f"静态发布失败: {str(e)}"}


@router.post("/source")
async def sync_source_to_vercel(request: Request):
    try:
        payload = await request.json()
        blog_path, error = resolve_blog_path(payload.get("blogPath", ""))
        if error:
            return {"success": False, "message": error}

        if not os.path.exists(CONFIG_FILE):
            return {"success": False, "message": "未找到部署配置，请先保存配置。"}

        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            config = json.load(f)

        source_repo = config.get("sourceRepoUrl", "").strip()
        source_branch = config.get("sourceBranch", "main").strip()

        if not source_repo:
            return {"success": False, "message": "源码仓库地址为空，无法同步。"}
        if not is_safe_git_ref(source_branch):
            return {"success": False, "message": "源码分支名称不合法。"}

        # Only stage the public site. The local manager keeps secrets such as
        # picBedToken in my-blog-manager/siteConfig.ts and must not be pushed by
        # the one-click Vercel source sync.
        add_process = run_command(["git", "add", "-A", "--", *PUBLIC_SITE_STAGE_PATHS], cwd=blog_path)
        if add_process.returncode != 0:
            return {"success": False, "message": f"暂存改动失败:\n{add_process.stderr}"}

        commit_process = run_command(
            ["git", "commit", "-m", "Sync source code for Vercel"],
            cwd=blog_path,
        )
        commit_output = f"{commit_process.stdout}\n{commit_process.stderr}".lower()
        no_changes = "nothing to commit" in commit_output or "no changes" in commit_output
        if commit_process.returncode != 0 and not no_changes:
            return {"success": False, "message": f"提交源码失败:\n{commit_process.stderr}"}

        ssh_dir = os.path.expanduser("~/.ssh")
        priv_key_path = os.path.join(ssh_dir, "id_ed25519_source").replace("\\", "/")
        custom_env = os.environ.copy()
        custom_env["GIT_SSH_COMMAND"] = (
            f'ssh -i "{priv_key_path}" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new'
        )

        push_process = run_command(
            ["git", "push", source_repo, f"HEAD:{source_branch}"],
            cwd=blog_path,
            env=custom_env,
        )

        if push_process.returncode != 0 and "Everything up-to-date" not in push_process.stderr:
            return {"success": False, "message": f"源码同步失败:\n{push_process.stderr}"}

        return {"success": True, "message": "源码已同步，Vercel 构建已触发。"}

    except Exception as e:
        return {"success": False, "message": f"源码同步失败: {str(e)}"}
