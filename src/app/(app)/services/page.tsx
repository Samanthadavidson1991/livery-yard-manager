import Link from "next/link";
import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { updateMyServices } from "@/lib/actions/services";
import {
  Card,
  PageHeader,
  EmptyState,
  LinkButton,
  Badge,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

function money(n: number) {
  return `£${n.toFixed(2)}`;
}

export default async function ServicesPage() {
  const user = await requireModule("services");

  const services = await prisma.catalogItem.findMany({
    where: { type: "SERVICE", active: true },
    orderBy: { name: "asc" },
  });

  if (user.role === "ADMIN") {
    const liveries = await prisma.livery.findMany({
      orderBy: { name: "asc" },
      include: {
        services: { where: { active: true }, include: { catalogItem: true } },
      },
    });
    return (
      <div>
        <PageHeader
          title="Services"
          subtitle="Recurring yard services each livery has opted into"
          action={<LinkButton href="/admin/catalog">Manage catalog</LinkButton>}
        />
        <Card>
          {liveries.length === 0 ? (
            <EmptyState title="No liveries yet" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {liveries.map((l) => (
                <li key={l.id} className="px-5 py-4">
                  <Link href={`/admin/liveries/${l.id}`} className="font-medium text-brand-800 hover:underline">
                    {l.name}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {l.services.length === 0 ? (
                      <span className="text-sm text-gray-400">No active services</span>
                    ) : (
                      l.services.map((s) => (
                        <Badge key={s.id} color="green">
                          {s.catalogItem.name} · {money(s.catalogItem.price)}
                          {s.catalogItem.frequency ? `/${s.catalogItem.frequency.toLowerCase()}` : ""}
                        </Badge>
                      ))
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    );
  }

  // Livery view: checkbox opt-in
  const active = await prisma.liveryService.findMany({
    where: { liveryId: user.liveryId ?? "__none__", active: true },
  });
  const activeIds = new Set(active.map((a) => a.catalogItemId));

  return (
    <div>
      <PageHeader title="Services" subtitle="Tick the services you'd like. These are added to your bill." />
      <Card className="p-5 max-w-2xl">
        {services.length === 0 ? (
          <EmptyState title="No services available" hint="The yard hasn't added any services yet." />
        ) : (
          <form action={updateMyServices} className="space-y-3">
            {services.map((s) => (
              <label key={s.id} className="flex items-start gap-3 border border-gray-100 rounded-lg p-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="services"
                  value={s.id}
                  defaultChecked={activeIds.has(s.id)}
                  className="h-4 w-4 mt-1 rounded border-gray-300 text-brand-600"
                />
                <span className="flex-1">
                  <span className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">{s.name}</span>
                    <span className="text-sm font-medium text-brand-700">
                      {money(s.price)}
                      {s.frequency ? ` / ${s.frequency.toLowerCase()}` : ""}
                    </span>
                  </span>
                  {s.description && (
                    <span className="block text-sm text-gray-500">{s.description}</span>
                  )}
                </span>
              </label>
            ))}
            <SubmitButton>Save my services</SubmitButton>
          </form>
        )}
      </Card>
    </div>
  );
}
