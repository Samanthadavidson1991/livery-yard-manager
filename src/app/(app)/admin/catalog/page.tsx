import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting, STORE_BANNER_SETTING } from "@/lib/modules";
import {
  createCatalogItem,
  toggleCatalogActive,
  deleteCatalogItem,
  setStoreBanner,
} from "@/lib/actions/catalog";
import {
  Card,
  PageHeader,
  Badge,
  Field,
  TextArea,
  inputClass,
  labelClass,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

function money(n: number) {
  return `£${n.toFixed(2)}`;
}

function ItemList({
  title,
  items,
}: {
  title: string;
  items: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    frequency: string | null;
    active: boolean;
  }[];
}) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-brand-900 mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">None yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between py-2 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {it.name}{" "}
                  <span className="text-brand-700">{money(it.price)}</span>
                  {it.frequency && (
                    <span className="text-gray-400"> / {it.frequency.toLowerCase()}</span>
                  )}
                </p>
                {it.description && (
                  <p className="text-xs text-gray-500 truncate">{it.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {!it.active && <Badge color="red">Inactive</Badge>}
                <form action={toggleCatalogActive}>
                  <input type="hidden" name="id" value={it.id} />
                  <button className="text-sm text-brand-700 hover:underline">
                    {it.active ? "Disable" : "Enable"}
                  </button>
                </form>
                <form action={deleteCatalogItem}>
                  <input type="hidden" name="id" value={it.id} />
                  <button className="text-sm text-red-600 hover:underline">Delete</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default async function CatalogPage() {
  await requireAdmin();
  const [items, banner] = await Promise.all([
    prisma.catalogItem.findMany({ orderBy: { name: "asc" } }),
    getSetting(STORE_BANNER_SETTING),
  ]);
  const services = items.filter((i) => i.type === "SERVICE");
  const store = items.filter((i) => i.type === "STORE");

  return (
    <div>
      <PageHeader
        title="Catalog & Store"
        subtitle="Define the services and store items available to liveries"
      />

      <Card className="p-5 mb-6">
        <h2 className="font-semibold text-brand-900 mb-3">Store notice banner</h2>
        <p className="text-sm text-gray-500 mb-3">
          Shown at the top of the store (e.g. &quot;Next bulk order: Friday 14th&quot;).
        </p>
        <form action={setStoreBanner} className="flex gap-2">
          <input
            name="message"
            defaultValue={banner ?? ""}
            placeholder="Next order due…"
            className={inputClass}
          />
          <SubmitButton>Save</SubmitButton>
        </form>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <ItemList title="Services (recurring)" items={services} />
        <ItemList title="Store items (one-off)" items={store} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-5">
          <h2 className="font-semibold text-brand-900 mb-4">Add service</h2>
          <form action={createCatalogItem} className="space-y-3">
            <input type="hidden" name="type" value="SERVICE" />
            <Field label="Name" name="name" required placeholder="e.g. Full Livery" />
            <TextArea label="Description" name="description" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (£)" name="price" type="number" step="0.01" />
              <label className="block">
                <span className={labelClass}>Frequency</span>
                <select name="frequency" className={inputClass} defaultValue="DAILY">
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </label>
            </div>
            <SubmitButton>Add service</SubmitButton>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-brand-900 mb-4">Add store item</h2>
          <form action={createCatalogItem} className="space-y-3">
            <input type="hidden" name="type" value="STORE" />
            <Field label="Name" name="name" required placeholder="e.g. Shavings Bale" />
            <TextArea label="Description" name="description" />
            <Field label="Price (£)" name="price" type="number" step="0.01" />
            <SubmitButton>Add store item</SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
