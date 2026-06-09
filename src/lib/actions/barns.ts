"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function createBarn(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.barn.create({
    data: {
      name,
      description: String(formData.get("description") ?? "").trim() || null,
    },
  });
  revalidatePath("/barns");
}

export async function deleteBarn(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.barn.delete({ where: { id } });
  revalidatePath("/barns");
}

export async function addBox(formData: FormData) {
  await requireAdmin();
  const barnId = String(formData.get("barnId"));
  const number = String(formData.get("number") ?? "").trim();
  if (!number) return;
  await prisma.box.create({
    data: {
      barnId,
      number,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  revalidatePath("/barns");
}

export async function deleteBox(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.box.delete({ where: { id } });
  revalidatePath("/barns");
}

// Assign (or clear) which horse occupies a box.
export async function assignBox(formData: FormData) {
  await requireAdmin();
  const boxId = String(formData.get("boxId"));
  const horseId = String(formData.get("horseId") ?? "").trim();

  // Clear any horse currently in this box.
  await prisma.horse.updateMany({ where: { boxId }, data: { boxId: null } });

  if (horseId) {
    // Remove the horse from any other box first (boxId is unique).
    await prisma.horse.update({ where: { id: horseId }, data: { boxId } });
  }
  revalidatePath("/barns");
}
