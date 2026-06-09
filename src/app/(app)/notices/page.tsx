import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { createNotice, deleteNotice } from "@/lib/actions/notices";
import {
  Card,
  PageHeader,
  EmptyState,
  Badge,
  Field,
  TextArea,
  labelClass,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";

export default async function NoticesPage() {
  const user = await requireModule("notices");
  const isAdmin = user.role === "ADMIN";
  const notices = await prisma.notice.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { createdBy: true },
  });

  return (
    <div>
      <PageHeader
        title="Notice Board"
        subtitle={isAdmin ? "Post announcements for all liveries" : "Yard announcements"}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className={isAdmin ? "lg:col-span-2 space-y-4" : "lg:col-span-3 space-y-4"}>
          {notices.length === 0 ? (
            <Card>
              <EmptyState title="No notices yet" />
            </Card>
          ) : (
            notices.map((n) => (
              <Card key={n.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-brand-900">{n.title}</h2>
                      {n.pinned && <Badge color="amber">Pinned</Badge>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {n.createdBy?.name ?? "Admin"} · {n.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Link href={`/notices/${n.id}/edit`} className="text-sm text-brand-700 hover:underline">
                        Edit
                      </Link>
                      <form action={deleteNotice}>
                        <input type="hidden" name="id" value={n.id} />
                        <button className="text-sm text-red-600 hover:underline">Delete</button>
                      </form>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{n.body}</p>
              </Card>
            ))
          )}
        </div>

        {isAdmin && (
          <Card className="p-5 h-fit">
            <h2 className="font-semibold text-brand-900 mb-4">New notice</h2>
            <form action={createNotice} className="space-y-3">
              <Field label="Title" name="title" required />
              <TextArea label="Message" name="body" rows={5} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="pinned" className="h-4 w-4 rounded border-gray-300 text-brand-600" />
                <span className={labelClass + " mb-0"}>Pin to top</span>
              </label>
              <SubmitButton>Post notice</SubmitButton>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
