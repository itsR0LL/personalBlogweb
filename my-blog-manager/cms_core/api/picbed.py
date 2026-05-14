from fastapi import APIRouter, Body, UploadFile, File, Form
import httpx

router = APIRouter()


def normalize_lsky_base(url: str) -> str:
    """Accept either the Lsky root URL or the documented /api/v1 base URL."""
    cleaned = (url or "").strip().rstrip("/")
    if cleaned.endswith("/api/v1"):
        cleaned = cleaned[: -len("/api/v1")]
    return cleaned


def build_auth_headers(token: str) -> dict:
    cleaned_token = (token or "").strip()
    if not cleaned_token.startswith("Bearer "):
        cleaned_token = f"Bearer {cleaned_token}"

    return {
        "Authorization": cleaned_token,
        "Accept": "application/json",
    }


async def image_url_works(client: httpx.AsyncClient, url: str) -> bool:
    if not url:
        return False

    try:
        response = await client.head(url, follow_redirects=True)
        content_type = response.headers.get("content-type", "")
        if 200 <= response.status_code < 400 and content_type.startswith("image/"):
            return True
    except httpx.RequestError:
        pass

    try:
        response = await client.get(url, headers={"Range": "bytes=0-0"}, follow_redirects=True)
        content_type = response.headers.get("content-type", "")
        return 200 <= response.status_code < 400 and content_type.startswith("image/")
    except httpx.RequestError:
        return False


async def resolve_image_url(client: httpx.AsyncClient, direct_url: str, thumbnail_url: str = "") -> str:
    """Prefer the original direct link, but fall back when Lsky returns a broken short URL."""
    if await image_url_works(client, direct_url):
        return direct_url
    if thumbnail_url and await image_url_works(client, thumbnail_url):
        return thumbnail_url
    return direct_url or thumbnail_url


async def map_lsky_image(client: httpx.AsyncClient, item: dict) -> dict:
    links = item.get("links", {}) if isinstance(item, dict) else {}
    direct_url = links.get("url") or ""
    thumbnail_url = links.get("thumbnail_url") or ""
    display_url = await resolve_image_url(client, direct_url, thumbnail_url)

    return {
        "key": item.get("key") or item.get("id") or item.get("pathname"),
        "name": item.get("origin_name") or item.get("name") or "untitled",
        "url": display_url,
        "originalUrl": direct_url,
        "thumbnailUrl": thumbnail_url or display_url,
        "size": item.get("size"),
        "width": item.get("width"),
        "height": item.get("height"),
        "date": item.get("date") or item.get("human_date"),
        "directUrlAvailable": display_url == direct_url,
    }


@router.post("/test")
async def test_picbed_connection(payload: dict = Body(...)):
    url = normalize_lsky_base(payload.get("url", ""))
    token = payload.get("token", "").strip()

    if not url or not token:
        return {"success": False, "message": "图床 API 地址和 Token 不能为空"}

    test_endpoint = f"{url}/api/v1/profile"
    headers = build_auth_headers(token)

    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True, trust_env=False) as client:
            response = await client.get(test_endpoint, headers=headers)

        if response.status_code != 200:
            return {
                "success": False,
                "message": f"校验失败：图床返回了 {response.status_code} 错误",
            }

        try:
            data = response.json()
        except ValueError:
            content_type = response.headers.get("content-type", "未知类型")
            return {
                "success": False,
                "message": f"图床返回的不是 JSON，请确认地址是 Lsky Pro API 地址。返回类型：{content_type}",
            }

        if data.get("status") is True:
            user_email = data.get("data", {}).get("email", "未知用户")
            return {"success": True, "message": f"连接成功，当前账户：{user_email}"}

        return {"success": False, "message": f"Token 无效：{data.get('message', '未知错误')}"}
    except httpx.TimeoutException:
        return {"success": False, "message": "网络超时：请检查图床地址是否可访问"}
    except httpx.RequestError as exc:
        return {"success": False, "message": f"网络异常：{type(exc).__name__}"}
    except Exception as exc:
        return {"success": False, "message": f"服务端异常：{type(exc).__name__}"}


@router.post("/images")
async def list_images(payload: dict = Body(...)):
    url = normalize_lsky_base(payload.get("url", ""))
    token = payload.get("token", "").strip()
    page = payload.get("page", 1)

    try:
        page = max(int(page), 1)
    except (TypeError, ValueError):
        page = 1

    if not url or not token:
        return {"success": False, "message": "图床 API 地址和 Token 不能为空", "images": []}

    list_endpoint = f"{url}/api/v1/images"
    headers = build_auth_headers(token)

    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True, trust_env=False) as client:
            response = await client.get(list_endpoint, headers=headers, params={"page": page})

            if response.status_code != 200:
                return {
                    "success": False,
                    "message": f"图库读取失败：图床返回了 {response.status_code} 错误",
                    "images": [],
                }

            try:
                data = response.json()
            except ValueError:
                content_type = response.headers.get("content-type", "未知类型")
                return {
                    "success": False,
                    "message": f"图库读取失败：图床返回的不是 JSON。返回类型：{content_type}",
                    "images": [],
                }

            if data.get("status") is not True:
                return {
                    "success": False,
                    "message": f"图库读取失败：{data.get('message', '未知错误')}",
                    "images": [],
                }

            payload_data = data.get("data", {})
            raw_images = payload_data.get("data", []) if isinstance(payload_data, dict) else []
            images = []

            for item in raw_images:
                image = await map_lsky_image(client, item)
                if image.get("url"):
                    images.append(image)

            return {
                "success": True,
                "message": "图库读取成功",
                "images": images,
                "pagination": {
                    "currentPage": payload_data.get("current_page", page),
                    "lastPage": payload_data.get("last_page", page),
                    "total": payload_data.get("total", len(images)),
                },
            }
    except httpx.TimeoutException:
        return {"success": False, "message": "图库读取超时：请检查图床网络", "images": []}
    except httpx.RequestError as exc:
        return {"success": False, "message": f"网络异常：{type(exc).__name__}", "images": []}
    except Exception as exc:
        return {"success": False, "message": f"服务端异常：{type(exc).__name__}", "images": []}


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    url: str = Form(...),
    token: str = Form(...),
):
    base_url = normalize_lsky_base(url)
    token = token.strip()

    if not base_url or not token:
        return {"success": False, "message": "图床 API 地址和 Token 不能为空"}

    upload_endpoint = f"{base_url}/api/v1/upload"
    headers = build_auth_headers(token)

    try:
        content = await file.read()
        files = {"file": (file.filename, content, file.content_type)}

        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, trust_env=False) as client:
            response = await client.post(upload_endpoint, headers=headers, files=files)

            if response.status_code != 200:
                return {"success": False, "message": f"上传失败：图床返回了 {response.status_code} 错误"}

            try:
                data = response.json()
            except ValueError:
                content_type = response.headers.get("content-type", "未知类型")
                return {
                    "success": False,
                    "message": f"上传失败：图床返回的不是 JSON。返回类型：{content_type}",
                }

            if data.get("status") is True:
                links = data.get("data", {}).get("links", {})
                direct_url = links.get("url") or ""
                thumbnail_url = links.get("thumbnail_url") or ""
                img_url = await resolve_image_url(client, direct_url, thumbnail_url)

                if not img_url:
                    return {"success": False, "message": "上传成功但未找到图片直链"}

                return {
                    "success": True,
                    "message": "上传成功",
                    "url": img_url,
                    "originalUrl": direct_url,
                    "thumbnailUrl": thumbnail_url or img_url,
                    "directUrlAvailable": img_url == direct_url,
                }

            return {"success": False, "message": f"图床拒绝接收：{data.get('message', '未知错误')}"}
    except httpx.TimeoutException:
        return {"success": False, "message": "图片上传超时，请检查网络或图片是否过大"}
    except httpx.RequestError as exc:
        return {"success": False, "message": f"网络异常：{type(exc).__name__}"}
    except Exception as exc:
        return {"success": False, "message": f"服务端异常：{type(exc).__name__}"}
