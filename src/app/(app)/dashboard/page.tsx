import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MODULES,
  getEnabledModules,
  getLiveryModules,
} from "@/lib/modules";
import { Card, PageHeader } from "@/components/ui";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-5">
      <p className="text-3xl font-semibold text-brand-700">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    const [liveries, horses, pendingBookings, openBillLines] = await Promise.all([
      prisma.livery.count(),
      prisma.horse.count(),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.storeOrder.count({ where: { billed: false } }),
    ]);
    const enabled = await getEnabledModules();
    const tiles = MODULES.filter((m) => enabled.includes(m.key));
    return (
      <div>
        <PageHeader
          title="Admin Dashboard"
          subtitle="Overview of your yard"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Livery accounts" value={liveries} />
          <StatCard label="Horses" value={horses} />
          <StatCard label="Pending bookings" value={pendingBookings} />
          <StatCard label="Unbilled store orders" value={openBillLines} />
        </div>
        <h2 className="text-lg font-semibold text-brand-900 mb-3">Modules</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map((m) => (
            <Link key={m.key} href={m.href}>
              <Card className="p-5 hover:border-brand-400 transition-colors h-full">
                <p className="font-medium text-brand-800">{m.label}</p>
                <p className="text-sm text-gray-500 mt-1">{m.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Livery dashboard
  if (!user.liveryId) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <Card className="p-6">
          <p className="text-gray-600">
            Your account isn&apos;t linked to a livery yet. Please contact the
            yard administrator.
          </p>
        </Card>
      </div>
    );
  }

  const [livery, horses, notices, allowed] = await Promise.all([
    prisma.livery.findUnique({ where: { id: user.liveryId } }),
    prisma.horse.count({ where: { liveryId: user.liveryId } }),
    prisma.notice.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
    getLiveryModules(user.liveryId),
  ]);
  const tiles = MODULES.filter((m) => allowed.includes(m.key));

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle={livery?.name}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Your horses" value={horses} />
        <StatCard label="Available features" value={tiles.length} />
      </div>

      {notices.length > 0 && (
        <Card className="p-5 mb-8">
          <h2 className="font-semibold text-brand-900 mb-3">Latest notices</h2>
          <ul className="space-y-2">
            {notices.map((n) => (
              <li key={n.id} className="text-sm">
                <span className="font-medium text-gray-800">{n.title}</span>
                <span className="text-gray-400">
                  {" "}
                  — {n.createdAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <h2 className="text-lg font-semibold text-brand-900 mb-3">Quick links</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((m) => (
          <Link key={m.key} href={m.href}>
            <Card className="p-5 hover:border-brand-400 transition-colors h-full">
              <p className="font-medium text-brand-800">{m.label}</p>
              <p className="text-sm text-gray-500 mt-1">{m.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
