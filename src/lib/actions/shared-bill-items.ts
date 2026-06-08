"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function createSharedBillItem(formData: FormData) {
  await requireAdmin();
  const description = String(formData.get("description") ?? "").trim();
  if (!description) return;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const unitPrice = Number(formData.get("unitPrice") ?? 0) || 0;
  const liveryIds = formData.getAll("liveryIds").map((v) => String(v));

  await prisma.sharedBillItem.create({
    data: {
      description,
      quantity,
      unitPrice,
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
  const liveryIds = formData.getAll("liveryIds").map((v) => String(v));

  // Replace the assignment set with the submitted checkboxes.
  await prisma.$transaction([
    prisma.sharedBillItem.update({
      where: { id },
      data: { description, quantity, unitPrice },
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
