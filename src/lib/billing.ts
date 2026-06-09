import { prisma } from "@/lib/prisma";

// A stable key for the current billing period of a given frequency. Used to
// guarantee an auto-add shared item is billed at most once per period.
export function periodKey(date: Date, frequency: string): string {
  if (frequency === "WEEKLY") {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
    d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday
    const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    const week =
      1 +
      Math.round(
        ((d.getTime() - firstThursday.getTime()) / 86400000 -
          3 +
          ((firstThursday.getUTCDay() + 6) % 7)) /
          7,
      );
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  // MONTHLY (default)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Human-readable invoice title for the current period. Monthly titles match the
// titles used by manual bill generation so auto-add lines land on the same bill.
export function periodTitle(date: Date, frequency: string): string {
  if (frequency === "WEEKLY") {
    return `Invoice week of ${date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  }
  return `Invoice ${date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  })}`;
}

// Reuse the current period's DRAFT invoice for a livery if one exists, else
// create it. Keeps manual + auto-added charges on a single invoice per period.
export async function findOrCreateDraftBill(liveryId: string, title: string) {
  const existing = await prisma.bill.findFirst({
    where: { liveryId, title, status: "DRAFT" },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  return prisma.bill.create({
    data: { liveryId, title, status: "DRAFT" },
  });
}

// Ensure every active auto-add shared item has been billed to each assigned
// livery for the current period. Idempotent: safe to call on every page load.
export async function reconcileAutoSharedItems(): Promise<void> {
  const now = new Date();
  const items = await prisma.sharedBillItem.findMany({
    where: { active: true, autoAdd: true },
    include: { liveries: true },
  });

  for (const item of items) {
    // Respect the optional date window: skip items not yet started or expired.
    if (item.startDate && now < item.startDate) continue;
    if (item.endDate && now > item.endDate) continue;

    const freq = item.frequency ?? "MONTHLY";
    const period = periodKey(now, freq);
    const title = periodTitle(now, freq);

    for (const a of item.liveries) {
      const already = await prisma.sharedBillItemApplication.findUnique({
        where: {
          sharedBillItemId_liveryId_period: {
            sharedBillItemId: item.id,
            liveryId: a.liveryId,
            period,
          },
        },
      });
      if (already) continue;

      const bill = await findOrCreateDraftBill(a.liveryId, title);
      try {
        await prisma.$transaction([
          prisma.sharedBillItemApplication.create({
            data: { sharedBillItemId: item.id, liveryId: a.liveryId, period },
          }),
          prisma.billLine.create({
            data: {
              billId: bill.id,
              description: item.description,
              quantity: item.quantity,
              // Per-livery override price when set, else the item's default.
              unitPrice: a.unitPrice ?? item.unitPrice,
            },
          }),
        ]);
      } catch {
        // Unique violation from a concurrent reconcile — already applied, skip.
      }
    }
  }
}
