import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { cancelBooking } from "@/lib/actions/bookings";
import {
  Card,
  PageHeader,
  EmptyState,
  Badge,
  LinkButton,
} from "@/components/ui";
import { BookingForm } from "@/components/booking-form";

const statusColor: Record<string, "gray" | "amber" | "green" | "red"> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "gray",
};

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

export default async function ArenaPage() {
  const user = await requireModule("arena");
  const isAdmin = user.role === "ADMIN";
  const now = new Date();

  const [arenas, liveries, upcoming, mine] = await Promise.all([
    prisma.arena.findMany({ orderBy: { name: "asc" } }),
    isAdmin
      ? prisma.livery.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      : Promise.resolve(undefined),
    prisma.booking.findMany({
      where: { status: "APPROVED", end: { gte: now } },
      orderBy: { start: "asc" },
      take: 30,
      include: { arena: true, livery: true },
    }),
    isAdmin
      ? Promise.resolve([])
      : prisma.booking.findMany({
          where: {
            liveryId: user.liveryId ?? "__none__",
            status: { in: ["PENDING", "APPROVED"] },
            end: { gte: now },
          },
          orderBy: { start: "asc" },
          include: { arena: true },
        }),
  ]);

  return (
    <div>
      <PageHeader
        title="Arena Booking"
        subtitle="Book the arena — clashes go to admin for approval"
        action={isAdmin ? <LinkButton href="/admin/bookings">Manage requests</LinkButton> : undefined}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 h-fit">
          <h2 className="font-semibold text-brand-900 mb-4">New booking</h2>
          {arenas.length === 0 ? (
            <EmptyState title="No arenas configured" hint="Add an arena in Settings." />
          ) : (
            <BookingForm arenas={arenas} liveries={liveries} />
          )}
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {!isAdmin && (
            <Card>
              <h2 className="font-semibold text-brand-900 px-5 pt-5">Your upcoming bookings</h2>
              {mine.length === 0 ? (
                <EmptyState title="You have no upcoming bookings" />
              ) : (
                <ul className="divide-y divide-gray-100 mt-2">
                  {mine.map((b) => (
                    <li key={b.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {b.arena.name}
                          {b.isRecurring && <span className="text-gray-400"> · recurring</span>}
                        </p>
                        <p className="text-xs text-gray-500">{timeRange(b.start, b.end)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge color={statusColor[b.status]}>{b.status}</Badge>
                        <form action={cancelBooking}>
                          <input type="hidden" name="id" value={b.id} />
                          <button className="text-sm text-red-600 hover:underline">Cancel</button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card>
            <h2 className="font-semibold text-brand-900 px-5 pt-5">
              Confirmed arena schedule
            </h2>
            <p className="text-xs text-gray-400 px-5">Check here before booking to avoid clashes.</p>
            {upcoming.length === 0 ? (
              <EmptyState title="No confirmed bookings" />
            ) : (
              <ul className="divide-y divide-gray-100 mt-2">
                {upcoming.map((b) => (
                  <li key={b.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{b.arena.name}</p>
                      <p className="text-xs text-gray-500">{timeRange(b.start, b.end)}</p>
                    </div>
                    <span className="text-sm text-gray-500">{b.livery.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
