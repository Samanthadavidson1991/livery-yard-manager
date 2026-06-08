"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}
function num(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Verify current user may manage this livery's horse (admin or owner)
async function assertLiveryAccess(liveryId: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.liveryId !== liveryId) {
    redirect("/dashboard");
  }
  return user;
}

function horseDataFromForm(formData: FormData) {
  const boxId = str(formData.get("boxId"));
  return {
    name: String(formData.get("name") ?? "").trim(),
    age: num(formData.get("age")),
    sex: str(formData.get("sex")),
    height: str(formData.get("height")),
    color: str(formData.get("color")),
    vetName: str(formData.get("vetName")),
    vetPhone: str(formData.get("vetPhone")),
    emergencyContact: str(formData.get("emergencyContact")),
    emergencyPhone: str(formData.get("emergencyPhone")),
    notes: str(formData.get("notes")),
    boxId: boxId,
  };
}

export async function createHorse(formData: FormData) {
  const user = await requireUser();
  let liveryId = String(formData.get("liveryId") ?? "");
  if (user.role !== "ADMIN") {
    if (!user.liveryId) redirect("/dashboard");
    liveryId = user.liveryId;
  }
  if (!liveryId) redirect("/dashboard");

  const data = horseDataFromForm(formData);
  if (!data.name) return;

  // Free the box if it's taken by another horse
  if (data.boxId) {
    await prisma.horse.updateMany({
      where: { boxId: data.boxId },
      data: { boxId: null },
    });
  }

  const horse = await prisma.horse.create({ data: { ...data, liveryId } });
  revalidatePath("/horses");
  redirect(`/horses/${horse.id}`);
}

export async function updateHorse(formData: FormData) {
  const id = String(formData.get("id"));
  const horse = await prisma.horse.findUnique({ where: { id } });
  if (!horse) redirect("/horses");
  await assertLiveryAccess(horse.liveryId);

  const data = horseDataFromForm(formData);
  if (data.boxId) {
    await prisma.horse.updateMany({
      where: { boxId: data.boxId, NOT: { id } },
      data: { boxId: null },
    });
  }
  await prisma.horse.update({ where: { id }, data });
  revalidatePath(`/horses/${id}`);
  revalidatePath("/barns");
}

export async function deleteHorse(formData: FormData) {
  const id = String(formData.get("id"));
  const horse = await prisma.horse.findUnique({ where: { id } });
  if (!horse) redirect("/horses");
  await assertLiveryAccess(horse.liveryId);
  await prisma.horse.delete({ where: { id } });
  revalidatePath("/horses");
  redirect("/horses");
}
