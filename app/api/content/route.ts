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

export async function GET(request: NextRequest) {
  const collection = request.nextUrl.searchParams.get("collection");

  if (collection === "albums") return NextResponse.json({ success: true, data: getRuntimeAlbums() });
  if (collection === "projects") return NextResponse.json({ success: true, data: getRuntimeProjects() });
  if (collection === "friends") return NextResponse.json({ success: true, data: getRuntimeFriends() });
  if (collection === "music") return NextResponse.json({ success: true, data: getRuntimeMusicConfig() });
  if (collection === "site") return NextResponse.json({ success: true, data: getRuntimeSiteConfig() });
  if (collection === "manifest") return NextResponse.json({ success: true, data: getContentManifest() });

  return NextResponse.json(
    { success: false, message: "Unsupported content collection." },
    { status: 400 },
  );
}
