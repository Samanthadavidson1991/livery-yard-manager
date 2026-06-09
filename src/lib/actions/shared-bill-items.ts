"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function parseFrequency(formData: FormData): string | null {
  const f = String(formData.get("frequency") ?? "MONTHLY");
  return f === "WEEKLY" ? "WEEKLY" : "MONTHLY";
}

// Parse a <input type="date"> value (YYYY-MM-DD) into a Date, or null if blank.
function parseDate(formData: FormData, name: string): Date | null {
  const v = String(formData.get(name) ?? "").trim();
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Build the per-livery assignment rows, reading an optional price override from
// the field `override_<liveryId>` for each ticked livery. Blank = no override.
function assignmentRows(
  formData: FormData,
  liveryIds: string[],
): { liveryId: string; unitPrice: number | null }[] {
  return liveryIds.map((liveryId) => {
    const raw = String(formData.get(`override_${liveryId}`) ?? "").trim();
    const n = raw === "" ? null : Number(raw);
    const unitPrice = n != null && Number.isFinite(n) ? n : null;
    return { liveryId, unitPrice };
  });
}

export async function createSharedBillItem(formData: FormData) {
  await requireAdmin();
  const description = String(formData.get("description") ?? "").trim();
  if (!description) return;
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  const unitPrice = Number(formData.get("unitPrice") ?? 0) || 0;
  const autoAdd = formData.get("autoAdd") != null;
  const frequency = autoAdd ? parseFrequency(formData) : null;
  const startDate = autoAdd ? parseDate(formData, "startDate") : null;
  const endDate = autoAdd ? parseDate(formData, "endDate") : null;
  const liveryIds = formData.getAll("liveryIds").map((v) => String(v));

  await prisma.sharedBillItem.create({
    data: {
      description,
      quantity,
      unitPrice,
      autoAdd,
      frequency,
      startDate,
      endDate,
      liveries: { create: assignmentRows(formData, liveryIds) },
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
  const startDate = autoAdd ? parseDate(formData, "startDate") : null;
  const endDate = autoAdd ? parseDate(formData, "endDate") : null;
  const liveryIds = formData.getAll("liveryIds").map((v) => String(v));

  // Replace the assignment set with the submitted checkboxes.
  await prisma.$transaction([
    prisma.sharedBillItem.update({
      where: { id },
      data: { description, quantity, unitPrice, autoAdd, frequency, startDate, endDate },
    }),
    prisma.sharedBillItemLivery.deleteMany({ where: { sharedBillItemId: id } }),
    prisma.sharedBillItemLivery.createMany({
      data: assignmentRows(formData, liveryIds).map((r) => ({
        sharedBillItemId: id,
        liveryId: r.liveryId,
        unitPrice: r.unitPrice,
      })),
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
