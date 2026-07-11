import {
  commentsServiceRequest,
  isAdminRequestAuthorized,
  passthroughJson,
} from "../../../../../lib/commentsServer";

export const dynamic = "force-dynamic";

type CommentAdminContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: CommentAdminContext) {
  if (!isAdminRequestAuthorized(request)) {
    return Response.json({ success: false, message: "无权访问评论管理接口" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await request.text();
  const response = await commentsServiceRequest(`/api/admin/comments/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
  return passthroughJson(response);
}

export async function DELETE(request: Request, context: CommentAdminContext) {
  if (!isAdminRequestAuthorized(request)) {
    return Response.json({ success: false, message: "无权访问评论管理接口" }, { status: 401 });
  }
  const { id } = await context.params;
  const response = await commentsServiceRequest(`/api/admin/comments/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return passthroughJson(response);
}
