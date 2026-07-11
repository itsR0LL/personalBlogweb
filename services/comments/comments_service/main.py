import hmac

from fastapi import Depends, FastAPI, Header, Query, Request
from fastapi.responses import JSONResponse

from . import __version__
from .config import get_settings
from .database import (
    CommentServiceError,
    comment_stats,
    create_comment,
    init_db,
    list_admin_comments,
    list_public_comments,
    soft_delete_comment,
    update_comment,
)
from .models import AdminCommentUpdate, CommentChannel, CommentStatus, PublicCommentCreate


settings = get_settings()
init_db(settings)

app = FastAPI(title="Personal Blog Comments", version=__version__)


def require_service_token(x_comments_service_token: str = Header(default="")) -> None:
    if not settings.service_token:
        raise CommentServiceError("COMMENTS_SERVICE_TOKEN is not configured", 503)
    if not hmac.compare_digest(x_comments_service_token, settings.service_token):
        raise CommentServiceError("Invalid comments service token", 401)


@app.exception_handler(CommentServiceError)
async def comment_error_handler(_: Request, exc: CommentServiceError):
    return JSONResponse(
        {"success": False, "message": str(exc)},
        status_code=exc.status_code,
    )


@app.get("/healthz")
def healthz():
    return {"success": True, "service": "personalblog-comments", "version": __version__}


@app.get("/api/public/comments", dependencies=[Depends(require_service_token)])
def public_comments(
    channel: CommentChannel,
    page: int = Query(1, ge=1, le=500),
    pageSize: int = Query(20, ge=1, le=50),
):
    comments, pagination = list_public_comments(settings, channel, page, pageSize)
    return {"success": True, "comments": comments, "pagination": pagination}


@app.post("/api/public/comments", dependencies=[Depends(require_service_token)])
def submit_public_comment(
    payload: PublicCommentCreate,
    x_visitor_ip: str = Header(default=""),
    user_agent: str = Header(default=""),
):
    comment = create_comment(settings, payload, x_visitor_ip, user_agent)
    return {
        "success": True,
        "message": "留言已提交，审核通过后会公开显示",
        "comment": comment,
    }


@app.get("/api/admin/comments", dependencies=[Depends(require_service_token)])
def admin_comments(
    page: int = Query(1, ge=1, le=500),
    pageSize: int = Query(30, ge=1, le=100),
    channel: CommentChannel | None = None,
    status: CommentStatus | None = None,
    q: str = Query("", max_length=120),
):
    comments, pagination = list_admin_comments(
        settings,
        page,
        pageSize,
        channel or "",
        status or "",
        q.strip(),
    )
    return {"success": True, "comments": comments, "pagination": pagination}


@app.get("/api/admin/comments/stats", dependencies=[Depends(require_service_token)])
def admin_comment_stats():
    return {"success": True, "data": comment_stats(settings)}


@app.patch("/api/admin/comments/{comment_id}", dependencies=[Depends(require_service_token)])
def patch_admin_comment(comment_id: str, payload: AdminCommentUpdate):
    comment = update_comment(settings, comment_id, payload)
    return {"success": True, "message": "留言已更新", "comment": comment}


@app.delete("/api/admin/comments/{comment_id}", dependencies=[Depends(require_service_token)])
def delete_admin_comment(comment_id: str):
    comment = soft_delete_comment(settings, comment_id)
    return {"success": True, "message": "留言已移入回收状态", "comment": comment}
