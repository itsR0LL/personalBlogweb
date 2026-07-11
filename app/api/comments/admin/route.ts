import {
  commentsServiceRequest,
  isAdminRequestAuthorized,
  passthroughJson,
} from "../../../../lib/commentsServer";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return Response.json({ success: false, message: "无权访问评论管理接口" }, { status: 401 });
  }
  const url = new URL(request.url);
  const target = url.searchParams.get("view") === "stats"
    ? "/api/admin/comments/stats"
    : `/api/admin/comments?${url.searchParams.toString()}`;
  const response = await commentsServiceRequest(target);
  return passthroughJson(response);
}
