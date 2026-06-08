"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { setEnabledModules, setSetting } from "@/lib/modules";

export async function updateEnabledModules(formData: FormData) {
  await requireAdmin();
  const keys = formData.getAll("modules").map(String);
  await setEnabledModules(keys);
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
}

export async function updateYardName(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("yardName") ?? "").trim();
  if (name) await setSetting("yard.name", name);
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
}

export async function addArena(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.arena.create({ data: { name } });
  revalidatePath("/admin/settings");
  revalidatePath("/arena");
}

export async function deleteArena(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.arena.delete({ where: { id } });
  revalidatePath("/admin/settings");
  revalidatePath("/arena");
}
