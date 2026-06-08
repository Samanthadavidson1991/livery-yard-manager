import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MODULES, getEnabledModules, getSetting } from "@/lib/modules";
import {
  updateEnabledModules,
  updateYardName,
  addArena,
  deleteArena,
} from "@/lib/actions/settings";
import { Card, PageHeader, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function SettingsPage() {
  await requireAdmin();
  const [enabled, yardName, arenas] = await Promise.all([
    getEnabledModules(),
    getSetting("yard.name"),
    prisma.arena.findMany({ orderBy: { name: "asc" } }),
  ]);
  const enabledSet = new Set(enabled);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Tailor the portal to your yard"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="font-semibold text-brand-900 mb-4">Yard name</h2>
          <form action={updateYardName} className="flex gap-2">
            <input
              name="yardName"
              defaultValue={yardName ?? "Livery Yard"}
              className={inputClass}
            />
            <SubmitButton>Save</SubmitButton>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-brand-900 mb-1">Arenas</h2>
          <p className="text-sm text-gray-500 mb-4">Spaces that can be booked.</p>
          {arenas.length > 0 && (
            <ul className="divide-y divide-gray-100 mb-4">
              {arenas.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-800">{a.name}</span>
                  <form action={deleteArena}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-sm text-red-600 hover:underline">Delete</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={addArena} className="flex gap-2">
            <input name="name" placeholder="New arena name" className={inputClass} required />
            <SubmitButton>Add</SubmitButton>
          </form>
        </Card>
      </div>

      <Card className="p-5 mt-6">
        <h2 className="font-semibold text-brand-900 mb-1">Features</h2>
        <p className="text-sm text-gray-500 mb-4">
          Turn modules on or off for the whole yard. Disabled modules disappear
          from everyone&apos;s menu. You can also control access per livery on each
          livery&apos;s page.
        </p>
        <form action={updateEnabledModules} className="space-y-2">
          <div className="grid sm:grid-cols-2 gap-2">
            {MODULES.map((m) => (
              <label
                key={m.key}
                className="flex items-start gap-2 border border-gray-100 rounded-lg p-3"
              >
                <input
                  type="checkbox"
                  name="modules"
                  value={m.key}
                  defaultChecked={enabledSet.has(m.key)}
                  className="h-4 w-4 mt-1 rounded border-gray-300 text-brand-600"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-800">{m.label}</span>
                  <span className="block text-xs text-gray-500">{m.description}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="pt-3">
            <SubmitButton>Save features</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
