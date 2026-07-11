import { getTurnstileSiteKey } from "../../../../lib/commentsServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteKey = getTurnstileSiteKey();
  return Response.json(
    {
      success: true,
      enabled: Boolean(siteKey),
      siteKey,
      maxAuthorLength: 24,
      maxContentLength: 300,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
