"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { setSetting, STORE_BANNER_SETTING } from "@/lib/modules";
import type { CatalogType } from "@prisma/client";

function num(v: FormDataEntryValue | null): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}
function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

export async function createCatalogItem(formData: FormData) {
  await requireAdmin();
  const typeRaw = String(formData.get("type") ?? "STORE");
  const type: CatalogType = typeRaw === "SERVICE" ? "SERVICE" : "STORE";
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await prisma.catalogItem.create({
    data: {
      name,
      description: str(formData.get("description")),
      price: num(formData.get("price")),
      type,
      frequency: type === "SERVICE" ? str(formData.get("frequency")) : null,
      active: true,
    },
  });
  revalidatePath("/admin/catalog");
  revalidatePath("/store");
  revalidatePath("/services");
}

export async function updateCatalogItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.catalogItem.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? item.name).trim() || item.name,
      description: str(formData.get("description")),
      price: num(formData.get("price")),
      frequency: item.type === "SERVICE" ? str(formData.get("frequency")) : null,
    },
  });
  revalidatePath("/admin/catalog");
  revalidatePath("/store");
  revalidatePath("/services");
}

export async function toggleCatalogActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.catalogItem.update({
    where: { id },
    data: { active: !item.active },
  });
  revalidatePath("/admin/catalog");
}

export async function deleteCatalogItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.catalogItem.delete({ where: { id } });
  revalidatePath("/admin/catalog");
}

export async function setStoreBanner(formData: FormData) {
  await requireAdmin();
  const message = String(formData.get("message") ?? "").trim();
  await setSetting(STORE_BANNER_SETTING, message);
  revalidatePath("/store");
  revalidatePath("/admin/catalog");
}
