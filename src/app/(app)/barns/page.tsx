import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import {
  createBarn,
  deleteBarn,
  addBox,
  deleteBox,
  assignBox,
} from "@/lib/actions/barns";
import {
  Card,
  PageHeader,
  EmptyState,
  Field,
  TextArea,
  inputClass,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function BarnsPage() {
  const user = await requireModule("barns");
  const isAdmin = user.role === "ADMIN";

  const [barns, horses] = await Promise.all([
    prisma.barn.findMany({
      orderBy: { name: "asc" },
      include: {
        boxes: {
          orderBy: { number: "asc" },
          include: { horse: { include: { livery: true } } },
        },
      },
    }),
    prisma.horse.findMany({
      orderBy: { name: "asc" },
      include: { livery: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Barns & Boxes"
        subtitle="Which horse is in which stable"
      />

      <div className="space-y-6">
        {barns.length === 0 ? (
          <Card>
            <EmptyState title="No barns yet" hint={isAdmin ? "Add your first barn below." : undefined} />
          </Card>
        ) : (
          barns.map((barn) => (
            <Card key={barn.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-brand-900">{barn.name}</h2>
                  {barn.description && (
                    <p className="text-sm text-gray-500">{barn.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <form action={deleteBarn}>
                    <input type="hidden" name="id" value={barn.id} />
                    <button className="text-sm text-red-600 hover:underline">Delete barn</button>
                  </form>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {barn.boxes.map((box) => (
                  <div
                    key={box.id}
                    className={`rounded-lg border p-3 ${box.horse ? "border-brand-200 bg-brand-50" : "border-dashed border-gray-300"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">Box {box.number}</span>
                      {isAdmin && (
                        <form action={deleteBox}>
                          <input type="hidden" name="id" value={box.id} />
                          <button className="text-xs text-red-500 hover:underline">remove</button>
                        </form>
                      )}
                    </div>
                    <p className="text-sm mt-1">
                      {box.horse ? (
                        <span className="text-brand-800 font-medium">
                          {box.horse.name}
                          <span className="text-gray-400 font-normal"> · {box.horse.livery.name}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">Empty</span>
                      )}
                    </p>

                    {isAdmin && (
                      <form action={assignBox} className="mt-2 flex gap-1">
                        <input type="hidden" name="boxId" value={box.id} />
                        <select
                          name="horseId"
                          defaultValue={box.horse?.id ?? ""}
                          className={`${inputClass} text-xs py-1`}
                        >
                          <option value="">— Empty —</option>
                          {horses.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name} ({h.livery.name})
                            </option>
                          ))}
                        </select>
                        <button className="text-xs text-brand-700 hover:underline px-1">Set</button>
                      </form>
                    )}
                  </div>
                ))}

                {isAdmin && (
                  <form action={addBox} className="rounded-lg border border-dashed border-gray-300 p-3 space-y-1">
                    <input type="hidden" name="barnId" value={barn.id} />
                    <input
                      name="number"
                      placeholder="New box no."
                      required
                      className={`${inputClass} text-sm py-1`}
                    />
                    <button className="text-sm text-brand-700 hover:underline">+ Add box</button>
                  </form>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {isAdmin && (
        <Card className="p-5 mt-6 max-w-md">
          <h2 className="font-semibold text-brand-900 mb-4">Add a barn</h2>
          <form action={createBarn} className="space-y-3">
            <Field label="Barn name" name="name" required />
            <TextArea label="Description" name="description" />
            <SubmitButton>Add barn</SubmitButton>
          </form>
        </Card>
      )}
    </div>
  );
}
