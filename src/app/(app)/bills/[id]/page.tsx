import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import {
  addBillLine,
  deleteBillLine,
  setBillStatus,
  deleteBill,
} from "@/lib/actions/bills";
import {
  Card,
  PageHeader,
  Badge,
  btnSecondary,
  btnDanger,
  inputClass,
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

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireModule("bills");
  const { id } = await params;
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: { lines: true, livery: true },
  });
  if (!bill) notFound();
  if (user.role !== "ADMIN" && user.liveryId !== bill.liveryId) {
    redirect("/bills");
  }
  const isAdmin = user.role === "ADMIN";
  const total = bill.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  return (
    <div>
      <PageHeader
        title={bill.title}
        subtitle={bill.livery.name}
        action={
          <Link href="/bills" className={btnSecondary}>
            Back to bills
          </Link>
        }
      />

      <Card className="p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <Badge color={statusColor[bill.status]}>{bill.status}</Badge>
          <span className="text-sm text-gray-500">
            {bill.createdAt.toLocaleDateString()}
          </span>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Amount</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {bill.lines.map((l) => (
              <tr key={l.id} className="border-b border-gray-100">
                <td className="py-2">{l.description}</td>
                <td className="py-2 text-right">{l.quantity}</td>
                <td className="py-2 text-right">{money(l.unitPrice)}</td>
                <td className="py-2 text-right">{money(l.quantity * l.unitPrice)}</td>
                {isAdmin && (
                  <td className="py-2 text-right">
                    <form action={deleteBillLine}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="billId" value={bill.id} />
                      <button className="text-red-600 hover:underline">✕</button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className="py-3" colSpan={3}>
                Total
              </td>
              <td className="py-3 text-right text-brand-700">{money(total)}</td>
              {isAdmin && <td></td>}
            </tr>
          </tfoot>
        </table>

        {isAdmin && (
          <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
            <form action={addBillLine} className="grid grid-cols-12 gap-2 items-end">
              <input type="hidden" name="billId" value={bill.id} />
              <input
                name="description"
                placeholder="Description"
                required
                className={`${inputClass} col-span-6`}
              />
              <input
                name="quantity"
                type="number"
                step="0.5"
                defaultValue={1}
                className={`${inputClass} col-span-2`}
              />
              <input
                name="unitPrice"
                type="number"
                step="0.01"
                defaultValue={0}
                className={`${inputClass} col-span-2`}
              />
              <div className="col-span-2">
                <SubmitButton>Add</SubmitButton>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              {(["DRAFT", "SENT", "PAID"] as const).map((s) => (
                <form key={s} action={setBillStatus}>
                  <input type="hidden" name="id" value={bill.id} />
                  <input type="hidden" name="status" value={s} />
                  <button className={btnSecondary} disabled={bill.status === s}>
                    Mark {s.toLowerCase()}
                  </button>
                </form>
              ))}
              <form action={deleteBill} className="ml-auto">
                <input type="hidden" name="id" value={bill.id} />
                <button className={btnDanger}>Delete bill</button>
              </form>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
