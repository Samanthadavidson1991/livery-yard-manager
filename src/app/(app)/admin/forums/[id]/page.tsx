import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addForumMember, removeForumMember } from "@/lib/actions/forums";
import {
  Card,
  PageHeader,
  Badge,
  btnSecondary,
  inputClass,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function AdminForumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const forum = await prisma.forum.findUnique({
    where: { id },
    include: { members: { include: { livery: true } } },
  });
  if (!forum) notFound();

  const memberLiveryIds = new Set(forum.members.map((m) => m.liveryId));
  const allLiveries = await prisma.livery.findMany({ orderBy: { name: "asc" } });
  const nonMembers = allLiveries.filter((l) => !memberLiveryIds.has(l.id));

  return (
    <div>
      <PageHeader
        title={forum.name}
        subtitle="Manage who can access this forum"
        action={
          <Link href="/admin/forums" className={btnSecondary}>
            Back
          </Link>
        }
      />

      {forum.isCentral ? (
        <Card className="p-6">
          <Badge color="green">Open forum</Badge>
          <p className="text-sm text-gray-600 mt-3">
            This is a central forum — every livery can already see and post in it,
            so there is no member list to manage.
          </p>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h2 className="font-semibold text-brand-900 mb-4">Members</h2>
            {forum.members.length === 0 ? (
              <p className="text-sm text-gray-500">No members yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {forum.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-800">{m.livery.name}</span>
                    <form action={removeForumMember}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="forumId" value={forum.id} />
                      <button className="text-sm text-red-600 hover:underline">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-brand-900 mb-4">Add a member</h2>
            {nonMembers.length === 0 ? (
              <p className="text-sm text-gray-500">All liveries are already members.</p>
            ) : (
              <form action={addForumMember} className="flex gap-2">
                <input type="hidden" name="forumId" value={forum.id} />
                <select name="liveryId" required className={inputClass} defaultValue="">
                  <option value="" disabled>
                    Select a livery…
                  </option>
                  {nonMembers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <SubmitButton>Add</SubmitButton>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
