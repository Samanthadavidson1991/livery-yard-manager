"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function parseFrequency(formData: FormData): string | null {
  const f = String(formData.get("frequency") ?? "MONTHLY");
  return f === "WEEKLY" ? "WEEKLY" : "MONTHLY";
}

export async function createSharedBillItem(formData: FormData) {
  await requireAdmin();
  const description = String(formData.get("description") ?? "").trim();
  if (!description) return;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const unitPrice = Number(formData.get("unitPrice") ?? 0) || 0;
  const autoAdd = formData.get("autoAdd") != null;
  const frequency = autoAdd ? parseFrequency(formData) : null;
  const liveryIds = formData.getAll("liveryIds").map((v) => String(v));

  await prisma.sharedBillItem.create({
    data: {
      description,
      quantity,
      unitPrice,
      autoAdd,
      frequency,
      liveries: { create: liveryIds.map((liveryId) => ({ liveryId })) },
    },
  });
  revalidatePath("/bills");
}

export async function updateSharedBillItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const description = String(formData.get("description") ?? "").trim();
  if (!description) return;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const unitPrice = Number(formData.get("unitPrice") ?? 0) || 0;
  const autoAdd = formData.get("autoAdd") != null;
  const frequency = autoAdd ? parseFrequency(formData) : null;
  const liveryIds = formData.getAll("liveryIds").map((v) => String(v));

  // Replace the assignment set with the submitted checkboxes.
  await prisma.$transaction([
    prisma.sharedBillItem.update({
      where: { id },
      data: { description, quantity, unitPrice, autoAdd, frequency },
    }),
    prisma.sharedBillItemLivery.deleteMany({ where: { sharedBillItemId: id } }),
    prisma.sharedBillItemLivery.createMany({
      data: liveryIds.map((liveryId) => ({ sharedBillItemId: id, liveryId })),
    }),
  ]);
  revalidatePath("/bills");
}

export async function toggleSharedBillItemActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const item = await prisma.sharedBillItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.sharedBillItem.update({
    where: { id },
    data: { active: !item.active },
  });
  revalidatePath("/bills");
}

export async function deleteSharedBillItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.sharedBillItem.delete({ where: { id } });
  revalidatePath("/bills");
}
