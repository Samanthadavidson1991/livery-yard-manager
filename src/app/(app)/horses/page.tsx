import Link from "next/link";
import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, EmptyState, LinkButton } from "@/components/ui";

export default async function HorsesPage() {
  const user = await requireModule("horses");
  const isAdmin = user.role === "ADMIN";

  const horses = await prisma.horse.findMany({
    where: isAdmin ? {} : { liveryId: user.liveryId ?? "__none__" },
    orderBy: { name: "asc" },
    include: {
      livery: true,
      box: { include: { barn: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Horses"
        subtitle={isAdmin ? "All horses on the yard" : "Your horses"}
        action={<LinkButton href="/horses/new">Add horse</LinkButton>}
      />
      <Card>
        {horses.length === 0 ? (
          <EmptyState title="No horses yet" hint="Add a horse to get started." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {horses.map((h) => (
              <li key={h.id}>
                <Link
                  href={`/horses/${h.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-brand-800">{h.name}</p>
                    <p className="text-sm text-gray-500">
                      {[h.sex, h.color, h.height].filter(Boolean).join(" · ") || "No details"}
                      {isAdmin && ` — ${h.livery.name}`}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 text-right">
                    {h.box ? `${h.box.barn.name} · ${h.box.number}` : "No box"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
