import { NextRequest, NextResponse } from "next/server";

import {
  getContentManifest,
  getRuntimeAlbums,
  getRuntimeFriends,
  getRuntimeMusicConfig,
  getRuntimeProjects,
  getRuntimeSiteConfig,
} from "../../../lib/contentSource";

export const dynamic = "force-dynamic";

function contentResponse(data: unknown) {
  return NextResponse.json(
    { success: true, data },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function GET(request: NextRequest) {
  const collection = request.nextUrl.searchParams.get("collection");

  if (collection === "albums") return contentResponse(getRuntimeAlbums());
  if (collection === "projects") return contentResponse(getRuntimeProjects());
  if (collection === "friends") return contentResponse(getRuntimeFriends());
  if (collection === "music") return contentResponse(getRuntimeMusicConfig());
  if (collection === "site") return contentResponse(getRuntimeSiteConfig());
  if (collection === "manifest") return contentResponse(getContentManifest());

  return NextResponse.json(
    { success: false, message: "Unsupported content collection." },
    { status: 400 },
  );
}
