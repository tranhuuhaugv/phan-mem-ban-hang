import { getSessionUser, getRolePermissionMap } from "@/lib/auth";
import { handler, ok } from "@/lib/api-utils";

export const GET = handler(async () => {
  const user = await getSessionUser();
  const permissions = user ? await getRolePermissionMap(user.role) : null;
  return ok({ user, permissions });
});
