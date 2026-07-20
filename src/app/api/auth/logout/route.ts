import { clearSessionCookie } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

export const POST = handler(async () => {
  await clearSessionCookie();
  return ok({ ok: true });
});
