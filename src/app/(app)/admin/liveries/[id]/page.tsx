import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MODULES } from "@/lib/modules";
import {
  updateLivery,
  deleteLivery,
  createLiveryUser,
  deleteLiveryUser,
  updateLiveryPermissions,
} from "@/lib/actions/liveries";
import {
  Card,
  PageHeader,
  Field,
  TextArea,
  btnDanger,
  btnSecondary,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function LiveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const livery = await prisma.livery.findUnique({
    where: { id },
    include: {
      users: true,
      horses: true,
      permissions: true,
      bills: true,
    },
  });
  if (!livery) notFound();

  const disabledModules = new Set(
    livery.permissions.filter((p) => !p.enabled).map((p) => p.module),
  );

  return (
    <div>
      <PageHeader
        title={livery.name}
        subtitle="Manage account details, logins and feature access"
        action={
          <Link href="/admin/liveries" className={btnSecondary}>
            Back to liveries
          </Link>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Details */}
        <Card className="p-5">
          <h2 className="font-semibold text-brand-900 mb-4">Account details</h2>
          <form action={updateLivery} className="space-y-3">
            <input type="hidden" name="id" value={livery.id} />
            <Field label="Account name" name="name" defaultValue={livery.name} required />
            <Field label="Contact name" name="contactName" defaultValue={livery.contactName} />
            <Field label="Email" name="email" type="email" defaultValue={livery.email} />
            <Field label="Phone" name="phone" defaultValue={livery.phone} />
            <Field label="Address line 1" name="addressLine1" defaultValue={livery.addressLine1} />
            <Field label="Address line 2" name="addressLine2" defaultValue={livery.addressLine2} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="City / town" name="city" defaultValue={livery.city} />
              <Field label="Postcode" name="postcode" defaultValue={livery.postcode} />
            </div>
            <TextArea label="Notes" name="notes" defaultValue={livery.notes} />
            <SubmitButton>Save details</SubmitButton>
          </form>
        </Card>

        <div className="space-y-6">
          {/* Logins */}
          <Card className="p-5">
            <h2 className="font-semibold text-brand-900 mb-4">Logins</h2>
            {livery.users.length === 0 ? (
              <p className="text-sm text-gray-500 mb-4">No logins yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 mb-4">
                {livery.users.map((u) => (
                  <li key={u.id} className="flex items-center justify-between py-2">
                    <div className="text-sm">
                      <p className="font-medium text-gray-800">{u.name}</p>
                      <p className="text-gray-500">{u.email}</p>
                    </div>
                    <form action={deleteLiveryUser}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="liveryId" value={livery.id} />
                      <button className="text-sm text-red-600 hover:underline">
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <form action={createLiveryUser} className="space-y-3 border-t border-gray-100 pt-4">
              <input type="hidden" name="liveryId" value={livery.id} />
              <p className="text-sm font-medium text-gray-700">Add a login</p>
              <Field label="Name" name="name" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Password (min 6 chars)" name="password" type="password" required />
              <SubmitButton>Add login</SubmitButton>
            </form>
          </Card>

          {/* Module access */}
          <Card className="p-5">
            <h2 className="font-semibold text-brand-900 mb-1">Feature access</h2>
            <p className="text-sm text-gray-500 mb-4">
              Choose which features this account can use.
            </p>
            <form action={updateLiveryPermissions} className="space-y-2">
              <input type="hidden" name="liveryId" value={livery.id} />
              {MODULES.map((m) => (
                <label key={m.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="modules"
                    value={m.key}
                    defaultChecked={!disabledModules.has(m.key)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600"
                  />
                  <span className="text-gray-700">{m.label}</span>
                </label>
              ))}
              <div className="pt-3">
                <SubmitButton>Save access</SubmitButton>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Horses & bills summary */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-5">
          <h2 className="font-semibold text-brand-900 mb-3">
            Horses ({livery.horses.length})
          </h2>
          {livery.horses.length === 0 ? (
            <p className="text-sm text-gray-500">No horses yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {livery.horses.map((h) => (
                <li key={h.id}>
                  <Link href={`/horses/${h.id}`} className="text-brand-700 hover:underline">
                    {h.name}
                  </Link>
                  <span className="text-gray-400"> — {h.sex ?? "?"}, {h.height ?? "?"}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Link href={`/horses/new?liveryId=${livery.id}`} className={btnSecondary}>
              Add horse
            </Link>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-brand-900 mb-3">Danger zone</h2>
          <p className="text-sm text-gray-500 mb-4">
            Deleting a livery removes its horses, documents, bills and logins.
          </p>
          <form action={deleteLivery}>
            <input type="hidden" name="id" value={livery.id} />
            <button className={btnDanger}>Delete livery</button>
          </form>
        </Card>
      </div>
    </div>
  );
}
