import { getManagerStatus, json } from "../../../../lib/managerAccess";

export const runtime = "nodejs";

export async function GET() {
  return json(getManagerStatus());
}
