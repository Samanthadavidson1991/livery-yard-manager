"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function createNotice(formData: FormData) {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;
  await prisma.notice.create({
    data: {
      title,
      body,
      pinned: formData.get("pinned") === "on",
      createdById: admin.id,
    },
  });
  revalidatePath("/notices");
}

export async function updateNotice(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.notice.update({
    where: { id },
    data: {
      title: String(formData.get("title") ?? "").trim(),
      body: String(formData.get("body") ?? "").trim(),
      pinned: formData.get("pinned") === "on",
    },
  });
  revalidatePath("/notices");
  redirect("/notices");
}

export async function deleteNotice(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.notice.delete({ where: { id } });
  revalidatePath("/notices");
}
