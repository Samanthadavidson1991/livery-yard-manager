import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { updateHorse, deleteHorse } from "@/lib/actions/horses";
import { Card, PageHeader, btnDanger, btnSecondary } from "@/components/ui";
import { HorseForm } from "@/components/horse-form";
import { DocumentsSection } from "@/components/documents-section";

export default async function HorseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireModule("horses");
  const { id } = await params;

  const horse = await prisma.horse.findUnique({
    where: { id },
    include: {
      livery: true,
      box: { include: { barn: true } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!horse) notFound();
  if (user.role !== "ADMIN" && user.liveryId !== horse.liveryId) {
    redirect("/horses");
  }

  const barns = await prisma.barn.findMany({
    orderBy: { name: "asc" },
    include: { boxes: { orderBy: { number: "asc" } } },
  });

  return (
    <div>
      <PageHeader
        title={horse.name}
        subtitle={`${horse.livery.name}${horse.box ? ` · ${horse.box.barn.name} ${horse.box.number}` : ""}`}
        action={
          <Link href="/horses" className={btnSecondary}>
            Back to horses
          </Link>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold text-brand-900 mb-4">Profile</h2>
          <HorseForm action={updateHorse} barns={barns} horse={horse} submitLabel="Save changes" />
        </Card>

        <div className="space-y-6">
          <DocumentsSection
            documents={horse.documents}
            horseId={horse.id}
            title="Horse documents"
            hint="Insurance, vet records and photos for this horse."
          />

          <Card className="p-5">
            <h2 className="font-semibold text-brand-900 mb-3">Danger zone</h2>
            <form action={deleteHorse}>
              <input type="hidden" name="id" value={horse.id} />
              <button className={btnDanger}>Delete horse</button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
