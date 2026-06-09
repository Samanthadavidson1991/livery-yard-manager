import { prisma } from "@/lib/prisma";

// Registry of optional modules. Admins can switch each one on/off for the whole
// yard, and can also grant/revoke access per livery account.
export const MODULES = [
  { key: "horses", label: "Horses", description: "Horse profiles & details", href: "/horses" },
  { key: "documents", label: "Documents", description: "Insurance docs & photos", href: "/documents" },
  { key: "bills", label: "Bills", description: "Invoices & statements", href: "/bills" },
  { key: "services", label: "Services", description: "Recurring yard services", href: "/services" },
  { key: "store", label: "Store", description: "Bedding, feed & extras", href: "/store" },
  { key: "notices", label: "Notice Board", description: "Yard-wide announcements", href: "/notices" },
  { key: "forums", label: "Forums", description: "Discussion boards", href: "/forums" },
  { key: "arena", label: "Arena Booking", description: "Book the arena", href: "/arena" },
  { key: "barns", label: "Barns & Boxes", description: "Stable allocation map", href: "/barns" },
  { key: "storage", label: "Storage", description: "Trailer & horsebox spots", href: "/storage" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];

export const ALL_MODULE_KEYS = MODULES.map((m) => m.key) as ModuleKey[];

const ENABLED_MODULES_SETTING = "modules.enabled";

// Globally enabled modules (admin Settings page). Defaults to all enabled.
export async function getEnabledModules(): Promise<ModuleKey[]> {
  const setting = await prisma.setting.findUnique({
    where: { key: ENABLED_MODULES_SETTING },
  });
  if (!setting) return [...ALL_MODULE_KEYS];
  try {
    const parsed = JSON.parse(setting.value) as string[];
    return ALL_MODULE_KEYS.filter((k) => parsed.includes(k));
  } catch {
    return [...ALL_MODULE_KEYS];
  }
}

export async function setEnabledModules(keys: string[]): Promise<void> {
  const valid = ALL_MODULE_KEYS.filter((k) => keys.includes(k));
  await prisma.setting.upsert({
    where: { key: ENABLED_MODULES_SETTING },
    update: { value: JSON.stringify(valid) },
    create: { key: ENABLED_MODULES_SETTING, value: JSON.stringify(valid) },
  });
}

// Modules a specific livery account can see: globally enabled AND granted to them.
export async function getLiveryModules(liveryId: string): Promise<ModuleKey[]> {
  const [enabled, perms] = await Promise.all([
    getEnabledModules(),
    prisma.liveryPermission.findMany({ where: { liveryId } }),
  ]);
  const permMap = new Map(perms.map((p) => [p.module, p.enabled]));
  // Default: if no explicit permission row, the module is granted.
  return enabled.filter((k) => permMap.get(k) !== false);
}

export async function isModuleEnabled(key: ModuleKey): Promise<boolean> {
  const enabled = await getEnabledModules();
  return enabled.includes(key);
}

// ---- Generic key/value settings helpers ----
export async function getSetting(key: string): Promise<string | null> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export const STORE_BANNER_SETTING = "store.nextOrder";
