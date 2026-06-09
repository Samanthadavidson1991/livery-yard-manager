import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import {
  createStorageSpot,
  updateStorageSpot,
  deleteStorageSpot,
} from "@/lib/actions/storage";
import {
  Card,
  PageHeader,
  EmptyState,
  Badge,
  Field,
  TextArea,
  inputClass,
  labelClass,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const typeLabel: Record<string, string> = {
  TRAILER: "Trailer",
  HORSEBOX: "Horsebox",
  OTHER: "Other",
};

export default async function StoragePage() {
  const user = await requireModule("storage");
  const isAdmin = user.role === "ADMIN";

  const [spots, liveries] = await Promise.all([
    prisma.storageSpot.findMany({
      orderBy: { label: "asc" },
      include: { assignedLivery: true },
    }),
    prisma.livery.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Trailer & Horsebox Storage"
        subtitle="Who parks where"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            {spots.length === 0 ? (
              <EmptyState title="No storage spots yet" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {spots.map((s) => {
                  const mine = !isAdmin && s.assignedLiveryId === user.liveryId;
                  return (
                    <li
                      key={s.id}
                      className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${mine ? "bg-brand-50" : ""}`}
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {s.label} {mine && <Badge color="green">Yours</Badge>}
                        </p>
                        <p className="text-sm text-gray-500">
                          {typeLabel[s.type]} ·{" "}
                          {s.assignedLivery ? s.assignedLivery.name : "Available"}
                        </p>
                        {s.notes && <p className="text-xs text-gray-400">{s.notes}</p>}
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <form action={updateStorageSpot} className="flex items-center gap-1">
                            <input type="hidden" name="id" value={s.id} />
                            <select
                              name="assignedLiveryId"
                              defaultValue={s.assignedLiveryId ?? ""}
                              className={`${inputClass} text-sm py-1`}
                            >
                              <option value="">— Available —</option>
                              {liveries.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.name}
                                </option>
                              ))}
                            </select>
                            <button className="text-sm text-brand-700 hover:underline px-1">Save</button>
                          </form>
                          <form action={deleteStorageSpot}>
                            <input type="hidden" name="id" value={s.id} />
                            <button className="text-sm text-red-600 hover:underline">Delete</button>
                          </form>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {isAdmin && (
          <Card className="p-5 h-fit">
            <h2 className="font-semibold text-brand-900 mb-4">Add storage spot</h2>
            <form action={createStorageSpot} className="space-y-3">
              <Field label="Label" name="label" required placeholder="e.g. Trailer Bay 3" />
              <label className="block">
                <span className={labelClass}>Type</span>
                <select name="type" className={inputClass} defaultValue="TRAILER">
                  <option value="TRAILER">Trailer</option>
                  <option value="HORSEBOX">Horsebox</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Assign to (optional)</span>
                <select name="assignedLiveryId" className={inputClass} defaultValue="">
                  <option value="">— Available —</option>
                  {liveries.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
              <TextArea label="Notes" name="notes" />
              <SubmitButton>Add spot</SubmitButton>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
