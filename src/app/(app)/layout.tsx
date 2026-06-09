import { requireUser } from "@/lib/auth";
import {
  MODULES,
  getEnabledModules,
  getLiveryModules,
  getSetting,
} from "@/lib/modules";
import { Sidebar, type NavItem } from "@/components/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const yardName = (await getSetting("yard.name")) ?? "Livery Yard";

  const moduleKeys =
    user.role === "ADMIN"
      ? await getEnabledModules()
      : user.liveryId
        ? await getLiveryModules(user.liveryId)
        : [];

  const items: NavItem[] = MODULES.filter((m) =>
    moduleKeys.includes(m.key),
  ).map((m) => ({ label: m.label, href: m.href }));

  const adminItems: NavItem[] =
    user.role === "ADMIN"
      ? [
          { label: "Liveries", href: "/admin/liveries" },
          { label: "Catalog & Store", href: "/admin/catalog" },
          { label: "Booking Requests", href: "/admin/bookings" },
          { label: "Forums", href: "/admin/forums" },
          { label: "Settings", href: "/admin/settings" },
        ]
      : [];

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar
        yardName={yardName}
        userName={user.name}
        role={user.role}
        items={items}
        adminItems={adminItems}
      />
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-6xl">{children}</main>
    </div>
  );
}
