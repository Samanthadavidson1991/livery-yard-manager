import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLivery } from "@/lib/actions/liveries";
import {
  Card,
  PageHeader,
  Field,
  TextArea,
  EmptyState,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function LiveriesPage() {
  await requireAdmin();
  const liveries = await prisma.livery.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { horses: true, users: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Livery Accounts"
        subtitle="Each livery is a customer account that can own multiple horses"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            {liveries.length === 0 ? (
              <EmptyState title="No liveries yet" hint="Add your first account on the right." />
            ) : (
              <ul className="divide-y divide-gray-100">
                {liveries.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/admin/liveries/${l.id}`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-brand-800">{l.name}</p>
                        <p className="text-sm text-gray-500">
                          {l.email ?? "No email"} · {l.phone ?? "No phone"}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500 text-right">
                        <p>{l._count.horses} horses</p>
                        <p>{l._count.users} logins</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div>
          <Card className="p-5">
            <h2 className="font-semibold text-brand-900 mb-4">New livery</h2>
            <form action={createLivery} className="space-y-3">
              <Field label="Account name" name="name" required placeholder="e.g. Jane Smith" />
              <Field label="Contact name" name="contactName" />
              <Field label="Email" name="email" type="email" />
              <Field label="Phone" name="phone" />
              <Field label="Address line 1" name="addressLine1" />
              <Field label="City / town" name="city" />
              <Field label="Postcode" name="postcode" />
              <TextArea label="Notes" name="notes" />
              <SubmitButton>Create livery</SubmitButton>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
