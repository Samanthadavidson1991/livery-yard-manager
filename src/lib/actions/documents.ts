"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { unlink } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";
import type { DocumentType } from "@prisma/client";

async function assertLiveryAccess(liveryId: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.liveryId !== liveryId) {
    redirect("/dashboard");
  }
  return user;
}

const DOC_TYPES: DocumentType[] = ["INSURANCE", "PHOTO", "BILL", "OTHER"];

export async function uploadDocument(formData: FormData) {
  let liveryId = String(formData.get("liveryId") ?? "");
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    if (!user.liveryId) redirect("/dashboard");
    liveryId = user.liveryId;
  }
  await assertLiveryAccess(liveryId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const title = String(formData.get("title") ?? "").trim() || file.name;
  const typeRaw = String(formData.get("type") ?? "OTHER");
  const type = (DOC_TYPES as string[]).includes(typeRaw)
    ? (typeRaw as DocumentType)
    : "OTHER";
  const horseId = String(formData.get("horseId") ?? "").trim() || null;

  const saved = await saveUploadedFile(file);
  await prisma.document.create({
    data: {
      liveryId,
      horseId,
      type,
      title,
      fileName: saved.fileName,
      filePath: saved.storedPath,
      mimeType: saved.mimeType,
      uploadedById: user.id,
    },
  });

  revalidatePath("/documents");
  if (horseId) revalidatePath(`/horses/${horseId}`);
}

export async function deleteDocument(formData: FormData) {
  const id = String(formData.get("id"));
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return;
  await assertLiveryAccess(doc.liveryId);
  await prisma.document.delete({ where: { id } });
  try {
    await unlink(doc.filePath);
  } catch {
    // file may already be gone; ignore
  }
  revalidatePath("/documents");
  if (doc.horseId) revalidatePath(`/horses/${doc.horseId}`);
}
