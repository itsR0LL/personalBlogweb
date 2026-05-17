import { NextResponse } from "next/server";

import { getContentManifest } from "../../../lib/contentSource";

export const dynamic = "force-dynamic";

export async function GET() {
  const manifest = getContentManifest();
  const hasRuntimeContent = Boolean(manifest);

  return NextResponse.json({
    code: {
      commit: process.env.APP_COMMIT || process.env.NEXT_PUBLIC_APP_COMMIT || "unknown",
      buildTime: process.env.APP_BUILD_TIME || process.env.NEXT_PUBLIC_APP_BUILD_TIME || "unknown",
      source: "self-hosted",
    },
    content: {
      version: manifest?.contentVersion || "bundled",
      updatedAt: manifest?.exportedAt || null,
      schemaVersion: manifest?.schemaVersion || null,
      source: hasRuntimeContent ? "bundle" : "bundled",
    },
    checkedAt: new Date().toISOString(),
  });
}
