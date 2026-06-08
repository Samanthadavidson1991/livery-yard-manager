import Link from "next/link";
import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { generateBill } from "@/lib/actions/bills";
import {
  createSharedBillItem,
  updateSharedBillItem,
  toggleSharedBillItemActive,
  deleteSharedBillItem,
} from "@/lib/actions/shared-bill-items";
import {
  Card,
  PageHeader,
  EmptyState,
  Badge,
  inputClass,
  labelClass,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

function money(n: number) {
  return `£${n.toFixed(2)}`;
}
const statusColor: Record<string, "gray" | "amber" | "green"> = {
  DRAFT: "gray",
  SENT: "amber",
  PAID: "green",
};

function billTotal(lines: { quantity: number; unitPrice: number }[]) {
  return lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
}

type LiveryOption = { id: string; name: string };
type SharedItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  active: boolean;
  liveries: { liveryId: string }[];
};

function LiveryCheckboxes({
  liveries,
  selected,
}: {
  liveries: LiveryOption[];
  selected: Set<string>;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {liveries.map((l) => (
        <label key={l.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="liveryIds"
            value={l.id}
            defaultChecked={selected.has(l.id)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600"
          />
          <span className="text-gray-700">{l.name}</span>
        </label>
      ))}
    </div>
  );
}

function SharedItemsManager({
  items,
  liveries,
}: {
  items: SharedItem[];
  liveries: LiveryOption[];
}) {
  return (
    <Card className="p-5 mb-6">
      <h2 className="font-semibold text-brand-900 mb-1">Shared bill items</h2>
      <p className="text-sm text-gray-500 mb-4">
        Define a charge once and tick the liveries it applies to. It is added as a
        line on every bill you generate for those liveries.
      </p>

      {items.length > 0 && (
        <ul className="divide-y divide-gray-100 mb-6">
          {items.map((item) => {
            const selected = new Set(item.liveries.map((a) => a.liveryId));
            return (
              <li key={item.id} className="py-4">
                <form action={updateSharedBillItem} className="space-y-3">
                  <input type="hidden" name="id" value={item.id} />
                  <div className="flex items-center gap-2">
                    {!item.active && <Badge color="red">Inactive</Badge>}
                    <span className="text-sm text-gray-400">
                      Applies to {selected.size} liver{selected.size === 1 ? "y" : "ies"}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_6rem_7rem]">
                    <label className="block">
                      <span className={labelClass}>Description</span>
                      <input
                        name="description"
                        defaultValue={item.description}
                        required
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Qty</span>
                      <input
                        name="quantity"
                        type="number"
                        step="0.01"
                        defaultValue={item.quantity}
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Unit price (£)</span>
                      <input
                        name="unitPrice"
                        type="number"
                        step="0.01"
                        defaultValue={item.unitPrice}
                        className={inputClass}
                      />
                    </label>
                  </div>
                  <LiveryCheckboxes liveries={liveries} selected={selected} />
                  <div className="flex items-center gap-4">
                    <SubmitButton>Save changes</SubmitButton>
                  </div>
                </form>
                <div className="flex items-center gap-4 mt-2">
                  <form action={toggleSharedBillItemActive}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="text-sm text-brand-700 hover:underline">
                      {item.active ? "Disable" : "Enable"}
                    </button>
                  </form>
                  <form action={deleteSharedBillItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="text-sm text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form action={createSharedBillItem} className="space-y-3 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700">Add a shared item</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_6rem_7rem]">
          <label className="block">
            <span className={labelClass}>Description</span>
            <input
              name="description"
              required
              placeholder="e.g. Yard insurance levy"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Qty</span>
            <input name="quantity" type="number" step="0.01" defaultValue={1} className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Unit price (£)</span>
            <input name="unitPrice" type="number" step="0.01" defaultValue={0} className={inputClass} />
          </label>
        </div>
        {liveries.length === 0 ? (
          <p className="text-sm text-gray-400">Add a livery first to assign this item.</p>
        ) : (
          <div>
            <span className={labelClass}>Apply to</span>
            <LiveryCheckboxes liveries={liveries} selected={new Set()} />
          </div>
        )}
        <SubmitButton>Add shared item</SubmitButton>
      </form>
    </Card>
  );
}

export default async function BillsPage() {
  const user = await requireModule("bills");

  if (user.role === "ADMIN") {
    const [liveries, sharedItems] = await Promise.all([
      prisma.livery.findMany({
        orderBy: { name: "asc" },
        include: {
          bills: { include: { lines: true }, orderBy: { createdAt: "desc" } },
          services: { where: { active: true } },
          storeOrders: { where: { billed: false } },
        },
      }),
      prisma.sharedBillItem.findMany({
        include: { liveries: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const activeSharedCountByLivery = new Map<string, number>();
    for (const item of sharedItems) {
      if (!item.active) continue;
      for (const a of item.liveries) {
        activeSharedCountByLivery.set(
          a.liveryId,
          (activeSharedCountByLivery.get(a.liveryId) ?? 0) + 1,
        );
      }
    }

    return (
      <div>
        <PageHeader title="Bills" subtitle="Generate and manage invoices per livery" />
        <SharedItemsManager items={sharedItems} liveries={liveries} />
        <div className="space-y-4">
          {liveries.map((l) => {
            const pending =
              l.services.length +
              l.storeOrders.length +
              (activeSharedCountByLivery.get(l.id) ?? 0);
            return (
              <Card key={l.id} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Link href={`/admin/liveries/${l.id}`} className="font-medium text-brand-800 hover:underline">
                    {l.name}
                  </Link>
                  <form action={generateBill}>
                    <input type="hidden" name="liveryId" value={l.id} />
                    <SubmitButton pendingText="Generating…">
                      Generate bill ({pending} item{pending === 1 ? "" : "s"})
                    </SubmitButton>
                  </form>
                </div>
                {l.bills.length === 0 ? (
                  <p className="text-sm text-gray-400">No bills yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {l.bills.map((b) => (
                      <li key={b.id} className="flex items-center justify-between py-2">
                        <Link href={`/bills/${b.id}`} className="text-sm text-brand-700 hover:underline">
                          {b.title}
                        </Link>
                        <div className="flex items-center gap-3">
                          <Badge color={statusColor[b.status]}>{b.status}</Badge>
                          <span className="text-sm font-medium">{money(billTotal(b.lines))}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Livery view
  const liveryId = user.liveryId ?? "__none__";
  const [bills, services, orders, sharedItems] = await Promise.all([
    prisma.bill.findMany({
      where: { liveryId },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.liveryService.findMany({
      where: { liveryId, active: true },
      include: { catalogItem: true },
    }),
    prisma.storeOrder.findMany({
      where: { liveryId, billed: false },
      include: { catalogItem: true },
    }),
    prisma.sharedBillItem.findMany({
      where: { active: true, liveries: { some: { liveryId } } },
    }),
  ]);

  const currentTotal =
    services.reduce((s, x) => s + x.catalogItem.price, 0) +
    orders.reduce((s, x) => s + x.catalogItem.price * x.quantity, 0) +
    sharedItems.reduce((s, x) => s + x.unitPrice * x.quantity, 0);

  return (
    <div>
      <PageHeader title="Bills" subtitle="Your invoices and current charges" />

      <Card className="p-5 mb-6">
        <h2 className="font-semibold text-brand-900 mb-3">Current charges (not yet invoiced)</h2>
        {services.length === 0 && orders.length === 0 && sharedItems.length === 0 ? (
          <p className="text-sm text-gray-400">No current charges.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {services.map((s) => (
              <li key={s.id} className="flex justify-between py-1.5 text-sm">
                <span>
                  {s.catalogItem.name}
                  {s.catalogItem.frequency ? ` (${s.catalogItem.frequency.toLowerCase()})` : ""}
                </span>
                <span>{money(s.catalogItem.price)}</span>
              </li>
            ))}
            {orders.map((o) => (
              <li key={o.id} className="flex justify-between py-1.5 text-sm">
                <span>{o.catalogItem.name} × {o.quantity} (store)</span>
                <span>{money(o.catalogItem.price * o.quantity)}</span>
              </li>
            ))}
            {sharedItems.map((s) => (
              <li key={s.id} className="flex justify-between py-1.5 text-sm">
                <span>
                  {s.description}
                  {s.quantity !== 1 ? ` × ${s.quantity}` : ""}
                </span>
                <span>{money(s.unitPrice * s.quantity)}</span>
              </li>
            ))}
            <li className="flex justify-between py-2 font-semibold border-t border-gray-100 mt-1">
              <span>Estimated total</span>
              <span className="text-brand-700">{money(currentTotal)}</span>
            </li>
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-brand-900 px-5 pt-5">Invoices</h2>
        {bills.length === 0 ? (
          <EmptyState title="No invoices yet" />
        ) : (
          <ul className="divide-y divide-gray-100 mt-2">
            {bills.map((b) => (
              <li key={b.id} className="flex items-center justify-between px-5 py-3">
                <Link href={`/bills/${b.id}`} className="text-sm text-brand-700 hover:underline">
                  {b.title}
                </Link>
                <div className="flex items-center gap-3">
                  <Badge color={statusColor[b.status]}>{b.status}</Badge>
                  <span className="text-sm font-medium">{money(billTotal(b.lines))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
