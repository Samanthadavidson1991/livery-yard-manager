"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { ALL_MODULE_KEYS } from "@/lib/modules";

function liveryDataFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    contactName: str(formData.get("contactName")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    addressLine1: str(formData.get("addressLine1")),
    addressLine2: str(formData.get("addressLine2")),
    city: str(formData.get("city")),
    postcode: str(formData.get("postcode")),
    notes: str(formData.get("notes")),
  };
}

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

export async function createLivery(formData: FormData) {
  await requireAdmin();
  const data = liveryDataFromForm(formData);
  if (!data.name) return;
  const livery = await prisma.livery.create({ data });
  revalidatePath("/admin/liveries");
  redirect(`/admin/liveries/${livery.id}`);
}

export async function updateLivery(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const data = liveryDataFromForm(formData);
  await prisma.livery.update({ where: { id }, data });
  revalidatePath(`/admin/liveries/${id}`);
}

export async function deleteLivery(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.livery.delete({ where: { id } });
  revalidatePath("/admin/liveries");
  redirect("/admin/liveries");
}

// Create a login (User) for a livery account
export async function createLiveryUser(formData: FormData) {
  await requireAdmin();
  const liveryId = String(formData.get("liveryId"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || password.length < 6) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "LIVERY",
      liveryId,
    },
  });
  revalidatePath(`/admin/liveries/${liveryId}`);
}

export async function deleteLiveryUser(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const liveryId = String(formData.get("liveryId"));
  await prisma.user.delete({ where: { id } });
  revalidatePath(`/admin/liveries/${liveryId}`);
}

// Save which modules a livery can access (checkbox list of enabled module keys)
export async function updateLiveryPermissions(formData: FormData) {
  await requireAdmin();
  const liveryId = String(formData.get("liveryId"));
  const granted = formData.getAll("modules").map(String);

  for (const key of ALL_MODULE_KEYS) {
    const enabled = granted.includes(key);
    await prisma.liveryPermission.upsert({
      where: { liveryId_module: { liveryId, module: key } },
      update: { enabled },
      create: { liveryId, module: key, enabled },
    });
  }
  revalidatePath(`/admin/liveries/${liveryId}`);
}
