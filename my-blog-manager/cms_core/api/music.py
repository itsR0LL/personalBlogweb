from fastapi import APIRouter
import requests
import re

router = APIRouter()


@router.get("/query/{song_id}")
def query_netease_music(song_id: str):
    """通过网易云公开接口查询歌曲详情"""
    song_id = song_id.strip()
    if not re.fullmatch(r"\d{1,20}", song_id):
        return {"success": False, "message": "歌曲 ID 只能是 1-20 位数字"}

    print(f"\n[API] Query NetEase song detail, ID: {song_id}")
    try:
        api_url = f"https://music.163.com/api/song/detail/?id={song_id}&ids=[{song_id}]"
        headers = {
            # 伪装得更像真实浏览器
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Referer": "https://music.163.com/"
        }
        session = requests.Session()
        session.trust_env = False
        response = session.get(api_url, headers=headers, timeout=5)

        # Log HTTP status for blocked or failed NetEase responses.
        print(f"[API] NetEase response status: {response.status_code}")

        data = response.json()

        if data.get("songs") and len(data["songs"]) > 0:
            song = data["songs"][0]
            print(f"[API] Query success: {song['name']} - {song['artists'][0]['name']}")
            return {
                "success": True,
                "data": {
                    "id": song_id,
                    "name": song["name"],
                    "artist": song["artists"][0]["name"],
                    "album": song["album"]["name"],
                    "cover": song["album"]["picUrl"]
                }
            }
        print(f"[API] Song not found, ID: {song_id}")
        return {"success": False, "message": "未找到该歌曲，可能是 VIP 歌曲或 ID 错误"}

    except Exception as e:
        # Keep logs ASCII-safe on Windows consoles.
        print(f"[API] NetEase query failed: {str(e)}")
        return {"success": False, "message": f"后端请求失败: {str(e)}"}
