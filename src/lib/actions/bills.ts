"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { BillStatus } from "@prisma/client";

// Generate a bill for a livery from active recurring services + unbilled store orders.
export async function generateBill(formData: FormData) {
  await requireAdmin();
  const liveryId = String(formData.get("liveryId") ?? "");
  if (!liveryId) return;

  const [services, orders, sharedItems] = await Promise.all([
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

  if (services.length === 0 && orders.length === 0 && sharedItems.length === 0) return;

  const now = new Date();
  const title = `Invoice ${now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;

  const lines = [
    ...services.map((s) => ({
      description: `${s.catalogItem.name}${s.catalogItem.frequency ? ` (${s.catalogItem.frequency.toLowerCase()})` : ""}`,
      quantity: 1,
      unitPrice: s.catalogItem.price,
    })),
    ...orders.map((o) => ({
      description: `${o.catalogItem.name} (store)`,
      quantity: o.quantity,
      unitPrice: o.catalogItem.price,
    })),
    ...sharedItems.map((s) => ({
      description: s.description,
      quantity: s.quantity,
      unitPrice: s.unitPrice,
    })),
  ];

  await prisma.bill.create({
    data: {
      liveryId,
      title,
      status: "DRAFT",
      lines: { create: lines },
    },
  });

  // Mark the store orders as billed so they don't get billed again
  await prisma.storeOrder.updateMany({
    where: { liveryId, billed: false },
    data: { billed: true },
  });

  revalidatePath("/bills");
  revalidatePath("/admin/liveries/" + liveryId);
}

export async function addBillLine(formData: FormData) {
  await requireAdmin();
  const billId = String(formData.get("billId"));
  const description = String(formData.get("description") ?? "").trim();
  if (!description) return;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const unitPrice = Number(formData.get("unitPrice") ?? 0) || 0;
  await prisma.billLine.create({
    data: { billId, description, quantity, unitPrice },
  });
  revalidatePath(`/bills/${billId}`);
}

export async function deleteBillLine(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const billId = String(formData.get("billId"));
  await prisma.billLine.delete({ where: { id } });
  revalidatePath(`/bills/${billId}`);
}

export async function setBillStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as BillStatus;
  await prisma.bill.update({ where: { id }, data: { status } });
  revalidatePath(`/bills/${id}`);
  revalidatePath("/bills");
}

export async function deleteBill(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.bill.delete({ where: { id } });
  revalidatePath("/bills");
  redirect("/bills");
}
