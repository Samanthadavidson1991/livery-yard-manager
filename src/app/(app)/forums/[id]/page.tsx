import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { createPost, userCanAccessForum } from "@/lib/actions/forums";
import {
  Card,
  PageHeader,
  EmptyState,
  Badge,
  btnSecondary,
  inputClass,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { EditablePost } from "@/components/editable-post";

export default async function ForumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireModule("forums");
  const { id } = await params;

  const forum = await prisma.forum.findUnique({
    where: { id },
    include: {
      posts: { orderBy: { createdAt: "asc" }, include: { author: true } },
    },
  });
  if (!forum) notFound();
  if (!(await userCanAccessForum(user, forum.id))) redirect("/forums");

  return (
    <div>
      <PageHeader
        title={forum.name}
        subtitle={forum.description ?? undefined}
        action={
          <Link href="/forums" className={btnSecondary}>
            Back to forums
          </Link>
        }
      />

      <div className="mb-4">
        {forum.isCentral ? (
          <Badge color="green">Open to all liveries</Badge>
        ) : (
          <Badge color="blue">Private group</Badge>
        )}
      </div>

      <Card className="p-5 mb-6">
        <h2 className="font-semibold text-brand-900 mb-3">Add a comment</h2>
        <form action={createPost} className="space-y-3">
          <input type="hidden" name="forumId" value={forum.id} />
          <textarea
            name="body"
            rows={3}
            required
            placeholder="Write something…"
            className={inputClass}
          />
          <SubmitButton>Post comment</SubmitButton>
        </form>
      </Card>

      <div className="space-y-3">
        {forum.posts.length === 0 ? (
          <Card>
            <EmptyState title="No comments yet" hint="Be the first to post." />
          </Card>
        ) : (
          forum.posts.map((p) => (
            <EditablePost
              key={p.id}
              id={p.id}
              forumId={forum.id}
              body={p.body}
              authorName={p.author?.name ?? "Unknown"}
              date={p.createdAt.toLocaleString()}
              canEdit={user.role === "ADMIN" || p.authorId === user.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
