import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { approveBooking, rejectBooking, cancelBooking } from "@/lib/actions/bookings";
import {
  Card,
  PageHeader,
  EmptyState,
  Badge,
  btnPrimary,
  btnDanger,
} from "@/components/ui";

function fmt(d: Date) {
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function timeRange(start: Date, end: Date) {
  return `${fmt(start)} – ${end.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}
export default async function AdminBookingsPage() {
  await requireAdmin();
  const now = new Date();

  // Pending "roots": singles + recurring parents (recurrenceParentId null).
  const pending = await prisma.booking.findMany({
    where: { status: "PENDING", recurrenceParentId: null },
    orderBy: { start: "asc" },
    include: { arena: true, livery: true },
  });

  // Count occurrences for recurring parents.
  const pendingWithCounts = await Promise.all(
    pending.map(async (b) => {
      const count = b.isRecurring
        ? await prisma.booking.count({
            where: { OR: [{ id: b.id }, { recurrenceParentId: b.id }] },
          })
        : 1;
      return { ...b, occurrences: count };
    }),
  );

  const upcoming = await prisma.booking.findMany({
    where: { status: "APPROVED", end: { gte: now } },
    orderBy: { start: "asc" },
    take: 50,
    include: { arena: true, livery: true },
  });

  return (
    <div>
      <PageHeader title="Booking Requests" subtitle="Approve or reject pending arena bookings" />

      <Card className="mb-6">
        <h2 className="font-semibold text-brand-900 px-5 pt-5">Pending requests</h2>
        {pendingWithCounts.length === 0 ? (
          <EmptyState title="No pending requests" hint="Everything is up to date." />
        ) : (
          <ul className="divide-y divide-gray-100 mt-2">
            {pendingWithCounts.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {b.arena.name} · {b.livery.name}
                    {b.isRecurring && (
                      <Badge color="blue">
                        Recurring × {b.occurrences} weeks
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{timeRange(b.start, b.end)}</p>
                  {b.notes && <p className="text-xs text-gray-400 mt-0.5">{b.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <form action={approveBooking}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className={btnPrimary}>Approve</button>
                  </form>
                  <form action={rejectBooking}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className={btnDanger}>Reject</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-brand-900 px-5 pt-5">Confirmed upcoming</h2>
        {upcoming.length === 0 ? (
          <EmptyState title="No confirmed bookings" />
        ) : (
          <ul className="divide-y divide-gray-100 mt-2">
            {upcoming.map((b) => (
              <li key={b.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {b.arena.name} · {b.livery.name}
                  </p>
                  <p className="text-xs text-gray-500">{timeRange(b.start, b.end)}</p>
                </div>
                <form action={cancelBooking}>
                  <input type="hidden" name="id" value={b.id} />
                  <button className="text-sm text-red-600 hover:underline">Cancel</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
