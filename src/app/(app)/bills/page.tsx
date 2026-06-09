import Link from "next/link";
import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { generateBill } from "@/lib/actions/bills";
import { reconcileAutoSharedItems } from "@/lib/billing";
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
  autoAdd: boolean;
  frequency: string | null;
  startDate: Date | null;
  endDate: Date | null;
  liveries: { liveryId: string; unitPrice: number | null }[];
};

// Format a Date for an <input type="date"> (YYYY-MM-DD), or "" when null.
function toDateInput(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function AutoAddFields({
  autoAdd,
  frequency,
  startDate,
  endDate,
}: {
  autoAdd: boolean;
  frequency: string | null;
  startDate: Date | null;
  endDate: Date | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="autoAdd"
          defaultChecked={autoAdd}
          className="h-4 w-4 rounded border-gray-300 text-brand-600"
        />
        <span className="text-gray-700">Auto-add recurring</span>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">every</span>
        <select
          name="frequency"
          defaultValue={frequency ?? "MONTHLY"}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="MONTHLY">Month</option>
          <option value="WEEKLY">Week</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">from</span>
        <input
          type="date"
          name="startDate"
          defaultValue={toDateInput(startDate)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">until</span>
        <input
          type="date"
          name="endDate"
          defaultValue={toDateInput(endDate)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </label>
      <span className="text-xs text-gray-400">(dates optional; blank = no limit)</span>
    </div>
  );
}

function LiveryCheckboxes({
  liveries,
  selected,
  overrides,
}: {
  liveries: LiveryOption[];
  selected: Set<string>;
  overrides?: Map<string, number | null>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {liveries.map((l) => {
        const ov = overrides?.get(l.id);
        return (
          <div key={l.id} className="flex items-center gap-2 text-sm">
            <label className="flex items-center gap-2 min-w-[10rem]">
              <input
                type="checkbox"
                name="liveryIds"
                value={l.id}
                defaultChecked={selected.has(l.id)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600"
              />
              <span className="text-gray-700">{l.name}</span>
            </label>
            <span className="text-gray-400 text-xs">£</span>
            <input
              type="number"
              step="0.01"
              name={`override_${l.id}`}
              defaultValue={ov != null ? String(ov) : ""}
              placeholder="default price"
              className="w-28 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        );
      })}
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
            const overrides = new Map(
              item.liveries.map((a) => [a.liveryId, a.unitPrice]),
            );
            return (
              <li key={item.id} className="py-4">
                <form action={updateSharedBillItem} className="space-y-3">
                  <input type="hidden" name="id" value={item.id} />
                  <div className="flex items-center gap-2">
                    {!item.active && <Badge color="red">Inactive</Badge>}
                    {item.autoAdd && (
                      <Badge color="blue">
                        Auto · {item.frequency === "WEEKLY" ? "Weekly" : "Monthly"}
                      </Badge>
                    )}
                    {item.autoAdd && (item.startDate || item.endDate) && (
                      <span className="text-xs text-gray-500">
                        {item.startDate ? `from ${toDateInput(item.startDate)}` : ""}
                        {item.endDate ? ` until ${toDateInput(item.endDate)}` : ""}
                      </span>
                    )}
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
                  <LiveryCheckboxes
                    liveries={liveries}
                    selected={selected}
                    overrides={overrides}
                  />
                  <AutoAddFields
                    autoAdd={item.autoAdd}
                    frequency={item.frequency}
                    startDate={item.startDate}
                    endDate={item.endDate}
                  />
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
        <AutoAddFields autoAdd={false} frequency={null} startDate={null} endDate={null} />
        <SubmitButton>Add shared item</SubmitButton>
      </form>
    </Card>
  );
}

export default async function BillsPage() {
  const user = await requireModule("bills");

  if (user.role === "ADMIN") {
    // Apply any due auto-add recurring items before reading current state.
    await reconcileAutoSharedItems();

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

    // Only manual (non auto-add) shared items count toward the "generate bill"
    // button — auto-add items are billed automatically by the reconcile above.
    const manualSharedCountByLivery = new Map<string, number>();
    for (const item of sharedItems) {
      if (!item.active || item.autoAdd) continue;
      for (const a of item.liveries) {
        manualSharedCountByLivery.set(
          a.liveryId,
          (manualSharedCountByLivery.get(a.liveryId) ?? 0) + 1,
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
              (manualSharedCountByLivery.get(l.id) ?? 0);
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
  // Apply any due auto-add recurring items so they appear on this livery's bills.
  await reconcileAutoSharedItems();

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
    // Only manual shared items are "not yet invoiced"; auto-add ones are already
    // placed on a bill by the reconcile above.
    prisma.sharedBillItem.findMany({
      where: { active: true, autoAdd: false, liveries: { some: { liveryId } } },
      // Load this livery's assignment row so we can honor a price override.
      include: { liveries: { where: { liveryId } } },
    }),
  ]);

  // Effective unit price for a shared item for this livery (override or default).
  const sharedPrice = (s: (typeof sharedItems)[number]) =>
    s.liveries[0]?.unitPrice ?? s.unitPrice;

  const currentTotal =
    services.reduce((s, x) => s + x.catalogItem.price, 0) +
    orders.reduce((s, x) => s + x.catalogItem.price * x.quantity, 0) +
    sharedItems.reduce((s, x) => s + sharedPrice(x) * x.quantity, 0);

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
                <span>{money(sharedPrice(s) * s.quantity)}</span>
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
