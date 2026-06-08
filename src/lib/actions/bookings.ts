"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";

function combine(date: string, time: string): Date | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Does [start,end) overlap any APPROVED booking in this arena (excluding a group)?
async function hasApprovedOverlap(
  arenaId: string,
  start: Date,
  end: Date,
  excludeGroupId?: string,
): Promise<boolean> {
  const overlap = await prisma.booking.findFirst({
    where: {
      arenaId,
      status: "APPROVED",
      start: { lt: end },
      end: { gt: start },
      ...(excludeGroupId
        ? {
            NOT: {
              OR: [{ id: excludeGroupId }, { recurrenceParentId: excludeGroupId }],
            },
          }
        : {}),
    },
  });
  return !!overlap;
}

export async function createBooking(formData: FormData) {
  const user = await requireUser();
  const liveryId =
    user.role === "ADMIN"
      ? String(formData.get("liveryId") ?? "")
      : user.liveryId ?? "";
  if (!liveryId) redirect("/dashboard");

  const arenaId = String(formData.get("arenaId") ?? "");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const isRecurring = formData.get("isRecurring") === "on";
  const weeks = isRecurring
    ? Math.min(52, Math.max(1, Number(formData.get("recurrenceWeeks") ?? 1) || 1))
    : 1;

  const start = combine(date, startTime);
  const end = combine(date, endTime);
  if (!arenaId || !start || !end || end <= start) return;

  // Build the list of weekly occurrences.
  const occurrences: { start: Date; end: Date }[] = [];
  for (let i = 0; i < weeks; i++) {
    const s = new Date(start);
    s.setDate(s.getDate() + i * 7);
    const e = new Date(end);
    e.setDate(e.getDate() + i * 7);
    occurrences.push({ start: s, end: e });
  }

  // Recurring bookings always require admin approval. A single booking is
  // auto-approved only when it doesn't clash with an existing approved booking.
  let parentId: string | null = null;
  for (let i = 0; i < occurrences.length; i++) {
    const occ = occurrences[i];
    const clash = await hasApprovedOverlap(arenaId, occ.start, occ.end);
    const status: "PENDING" | "APPROVED" =
      isRecurring || clash ? "PENDING" : "APPROVED";
    const recurrenceParentId: string | null = parentId;
    const created: { id: string } = await prisma.booking.create({
      data: {
        arenaId,
        liveryId,
        userId: user.id,
        start: occ.start,
        end: occ.end,
        status,
        isRecurring,
        recurrenceWeeks: isRecurring ? weeks : null,
        recurrenceParentId,
        notes,
      },
    });
    if (i === 0) parentId = created.id;
  }

  revalidatePath("/arena");
  revalidatePath("/admin/bookings");
}

function groupWhere(id: string) {
  return { OR: [{ id }, { recurrenceParentId: id }] };
}

export async function approveBooking(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const bookings = await prisma.booking.findMany({ where: groupWhere(id) });
  for (const b of bookings) {
    if (b.status !== "PENDING") continue;
    const clash = await hasApprovedOverlap(b.arenaId, b.start, b.end, id);
    await prisma.booking.update({
      where: { id: b.id },
      data: { status: clash ? "REJECTED" : "APPROVED" },
    });
  }
  revalidatePath("/arena");
  revalidatePath("/admin/bookings");
}

export async function rejectBooking(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.booking.updateMany({
    where: groupWhere(id),
    data: { status: "REJECTED" },
  });
  revalidatePath("/arena");
  revalidatePath("/admin/bookings");
}

export async function cancelBooking(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return;
  if (user.role !== "ADMIN" && user.liveryId !== booking.liveryId) return;
  // Cancel the whole recurring group if this is a parent.
  await prisma.booking.updateMany({
    where: groupWhere(id),
    data: { status: "CANCELLED" },
  });
  revalidatePath("/arena");
  revalidatePath("/admin/bookings");
}
