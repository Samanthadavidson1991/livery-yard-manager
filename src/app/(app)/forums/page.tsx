import Link from "next/link";
import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { Card, PageHeader, EmptyState, Badge, LinkButton } from "@/components/ui";

export default async function ForumsPage() {
  const user = await requireModule("forums");
  const isAdmin = user.role === "ADMIN";

  const forums = await prisma.forum.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { isCentral: true },
            { members: { some: { liveryId: user.liveryId ?? "__none__" } } },
          ],
        },
    orderBy: [{ isCentral: "desc" }, { name: "asc" }],
    include: { _count: { select: { posts: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Forums"
        subtitle="Discuss with the yard community"
        action={isAdmin ? <LinkButton href="/admin/forums">Manage forums</LinkButton> : undefined}
      />
      <Card>
        {forums.length === 0 ? (
          <EmptyState title="No forums available" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {forums.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/forums/${f.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-brand-800">{f.name}</span>
                      {f.isCentral ? (
                        <Badge color="green">Open to all</Badge>
                      ) : (
                        <Badge color="blue">Private</Badge>
                      )}
                    </div>
                    {f.description && (
                      <p className="text-sm text-gray-500">{f.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{f._count.posts} posts</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
