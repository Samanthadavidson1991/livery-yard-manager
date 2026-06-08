"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { StorageType } from "@prisma/client";

const TYPES: StorageType[] = ["TRAILER", "HORSEBOX", "OTHER"];

function asType(v: FormDataEntryValue | null): StorageType {
  const s = String(v ?? "TRAILER");
  return (TYPES as string[]).includes(s) ? (s as StorageType) : "TRAILER";
}

export async function createStorageSpot(formData: FormData) {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;
  await prisma.storageSpot.create({
    data: {
      label,
      type: asType(formData.get("type")),
      assignedLiveryId: String(formData.get("assignedLiveryId") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });
  revalidatePath("/storage");
}

export async function updateStorageSpot(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.storageSpot.update({
    where: { id },
    data: {
      assignedLiveryId: String(formData.get("assignedLiveryId") ?? "").trim() || null,
    },
  });
  revalidatePath("/storage");
}

export async function deleteStorageSpot(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.storageSpot.delete({ where: { id } });
  revalidatePath("/storage");
}
