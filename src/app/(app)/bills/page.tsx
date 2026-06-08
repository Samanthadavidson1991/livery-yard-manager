import Link from "next/link";
import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { generateBill } from "@/lib/actions/bills";
import {
  Card,
  PageHeader,
  EmptyState,
  Badge,
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

export default async function BillsPage() {
  const user = await requireModule("bills");

  if (user.role === "ADMIN") {
    const liveries = await prisma.livery.findMany({
      orderBy: { name: "asc" },
      include: {
        bills: { include: { lines: true }, orderBy: { createdAt: "desc" } },
        services: { where: { active: true } },
        storeOrders: { where: { billed: false } },
      },
    });
    return (
      <div>
        <PageHeader title="Bills" subtitle="Generate and manage invoices per livery" />
        <div className="space-y-4">
          {liveries.map((l) => {
            const pending = l.services.length + l.storeOrders.length;
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
  const [bills, services, orders] = await Promise.all([
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
  ]);

  const currentTotal =
    services.reduce((s, x) => s + x.catalogItem.price, 0) +
    orders.reduce((s, x) => s + x.catalogItem.price * x.quantity, 0);

  return (
    <div>
      <PageHeader title="Bills" subtitle="Your invoices and current charges" />

      <Card className="p-5 mb-6">
        <h2 className="font-semibold text-brand-900 mb-3">Current charges (not yet invoiced)</h2>
        {services.length === 0 && orders.length === 0 ? (
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
