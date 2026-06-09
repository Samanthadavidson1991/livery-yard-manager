"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

// Save the set of recurring services a livery has opted into (checkboxes).
export async function updateMyServices(formData: FormData) {
  const user = await requireUser();
  const liveryId =
    user.role === "ADMIN"
      ? String(formData.get("liveryId") ?? "")
      : user.liveryId ?? "";
  if (!liveryId) redirect("/dashboard");

  const selected = new Set(formData.getAll("services").map(String));
  const services = await prisma.catalogItem.findMany({
    where: { type: "SERVICE", active: true },
  });

  for (const svc of services) {
    const want = selected.has(svc.id);
    await prisma.liveryService.upsert({
      where: { liveryId_catalogItemId: { liveryId, catalogItemId: svc.id } },
      update: { active: want },
      create: { liveryId, catalogItemId: svc.id, active: want },
    });
  }
  revalidatePath("/services");
  revalidatePath("/bills");
}
