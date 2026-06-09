"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function addStoreItem(formData: FormData) {
  const user = await requireUser();
  const liveryId =
    user.role === "ADMIN"
      ? String(formData.get("liveryId") ?? "")
      : user.liveryId ?? "";
  if (!liveryId) redirect("/dashboard");

  const catalogItemId = String(formData.get("catalogItemId") ?? "");
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);
  const item = await prisma.catalogItem.findUnique({ where: { id: catalogItemId } });
  if (!item || item.type !== "STORE" || !item.active) return;

  await prisma.storeOrder.create({
    data: { liveryId, catalogItemId, quantity },
  });
  revalidatePath("/store");
  revalidatePath("/bills");
}

export async function removeStoreItem(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const order = await prisma.storeOrder.findUnique({ where: { id } });
  if (!order) return;
  if (user.role !== "ADMIN" && user.liveryId !== order.liveryId) return;
  if (order.billed) return; // can't remove once billed
  await prisma.storeOrder.delete({ where: { id } });
  revalidatePath("/store");
  revalidatePath("/bills");
}
