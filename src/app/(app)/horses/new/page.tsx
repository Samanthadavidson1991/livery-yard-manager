import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { createHorse } from "@/lib/actions/horses";
import { Card, PageHeader } from "@/components/ui";
import { HorseForm } from "@/components/horse-form";

export default async function NewHorsePage({
  searchParams,
}: {
  searchParams: Promise<{ liveryId?: string }>;
}) {
  const user = await requireModule("horses");
  const { liveryId } = await searchParams;
  const isAdmin = user.role === "ADMIN";

  const [barns, liveries] = await Promise.all([
    prisma.barn.findMany({
      orderBy: { name: "asc" },
      include: { boxes: { orderBy: { number: "asc" } } },
    }),
    isAdmin
      ? prisma.livery.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      : Promise.resolve(undefined),
  ]);

  return (
    <div>
      <PageHeader title="Add horse" subtitle="Create a new horse profile" />
      <Card className="p-6 max-w-3xl">
        <HorseForm
          action={createHorse}
          barns={barns}
          liveries={liveries ?? undefined}
          defaultLiveryId={liveryId}
          submitLabel="Create horse"
        />
      </Card>
    </div>
  );
}
