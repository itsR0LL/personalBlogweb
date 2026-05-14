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


def map_lsky_image(item: dict) -> dict:
    links = item.get("links", {}) if isinstance(item, dict) else {}
    return {
        "key": item.get("key") or item.get("id") or item.get("pathname"),
        "name": item.get("origin_name") or item.get("name") or "untitled",
        "url": links.get("url"),
        "thumbnailUrl": links.get("thumbnail_url") or links.get("url"),
        "size": item.get("size"),
        "width": item.get("width"),
        "height": item.get("height"),
        "date": item.get("date") or item.get("human_date"),
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
                "message": f"校验失败，图床返回了 {response.status_code} 错误",
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
    except httpx.RequestError as e:
        return {"success": False, "message": f"网络异常：{type(e).__name__}"}
    except Exception as e:
        return {"success": False, "message": f"服务端异常：{type(e).__name__}"}


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
                "message": f"图库读取失败，图床返回了 {response.status_code} 错误",
                "images": [],
            }

        try:
            data = response.json()
        except ValueError:
            content_type = response.headers.get("content-type", "未知类型")
            return {
                "success": False,
                "message": f"图库读取失败，图床返回的不是 JSON。返回类型：{content_type}",
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
        images = [image for image in (map_lsky_image(item) for item in raw_images) if image.get("url")]

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
    except httpx.RequestError as e:
        return {"success": False, "message": f"网络异常：{type(e).__name__}", "images": []}
    except Exception as e:
        return {"success": False, "message": f"服务端异常：{type(e).__name__}", "images": []}


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
            return {"success": False, "message": f"上传失败，图床返回了 {response.status_code} 错误"}

        try:
            data = response.json()
        except ValueError:
            content_type = response.headers.get("content-type", "未知类型")
            return {
                "success": False,
                "message": f"上传失败，图床返回的不是 JSON。返回类型：{content_type}",
            }

        if data.get("status") is True:
            img_url = data.get("data", {}).get("links", {}).get("url")
            if not img_url:
                return {"success": False, "message": "上传成功但未找到图片直链"}
            return {"success": True, "message": "上传成功", "url": img_url}

        return {"success": False, "message": f"图床拒绝接收：{data.get('message', '未知错误')}"}
    except httpx.TimeoutException:
        return {"success": False, "message": "图片上传超时，请检查网络或图片是否过大"}
    except httpx.RequestError as e:
        return {"success": False, "message": f"网络异常：{type(e).__name__}"}
    except Exception as e:
        return {"success": False, "message": f"服务端异常：{type(e).__name__}"}
