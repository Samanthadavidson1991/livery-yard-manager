import "server-only";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  getEnabledModules,
  getLiveryModules,
  type ModuleKey,
} from "@/lib/modules";
import type { User } from "@prisma/client";

// Ensure the current user may access a module. Admins need it globally enabled;
// liveries need it enabled AND granted to their account. Returns the user.
export async function requireModule(key: ModuleKey): Promise<User> {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    const enabled = await getEnabledModules();
    if (!enabled.includes(key)) redirect("/dashboard");
    return user;
  }
  if (!user.liveryId) redirect("/dashboard");
  const allowed = await getLiveryModules(user.liveryId);
  if (!allowed.includes(key)) redirect("/dashboard");
  return user;
}
