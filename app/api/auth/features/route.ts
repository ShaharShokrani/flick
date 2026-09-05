import { json } from "@/lib/api";
import { authFeatures } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET() {
  return json(authFeatures());
}
