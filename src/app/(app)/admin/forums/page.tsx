import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createForum, deleteForum } from "@/lib/actions/forums";
import {
  Card,
  PageHeader,
  Badge,
  Field,
  TextArea,
  labelClass,
  EmptyState,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function AdminForumsPage() {
  await requireAdmin();
  const forums = await prisma.forum.findMany({
    orderBy: [{ isCentral: "desc" }, { name: "asc" }],
    include: { _count: { select: { posts: true, members: true } } },
  });

  return (
    <div>
      <PageHeader title="Manage Forums" subtitle="Create boards and control who can access private ones" />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            {forums.length === 0 ? (
              <EmptyState title="No forums yet" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {forums.map((f) => (
                  <li key={f.id} className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/forums/${f.id}`} className="font-medium text-brand-800 hover:underline">
                          {f.name}
                        </Link>
                        {f.isCentral ? <Badge color="green">Open</Badge> : <Badge color="blue">Private</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">
                        {f._count.posts} posts · {f.isCentral ? "all liveries" : `${f._count.members} members`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {!f.isCentral && (
                        <Link href={`/admin/forums/${f.id}`} className="text-sm text-brand-700 hover:underline">
                          Members
                        </Link>
                      )}
                      <form action={deleteForum}>
                        <input type="hidden" name="id" value={f.id} />
                        <button className="text-sm text-red-600 hover:underline">Delete</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="p-5 h-fit">
          <h2 className="font-semibold text-brand-900 mb-4">New forum</h2>
          <form action={createForum} className="space-y-3">
            <Field label="Name" name="name" required />
            <TextArea label="Description" name="description" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isCentral" className="h-4 w-4 rounded border-gray-300 text-brand-600" />
              <span className={labelClass + " mb-0"}>Open to all liveries (central)</span>
            </label>
            <p className="text-xs text-gray-400">
              Leave unticked to create a private forum and add members manually.
            </p>
            <SubmitButton>Create forum</SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
