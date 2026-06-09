import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateNotice } from "@/lib/actions/notices";
import {
  Card,
  PageHeader,
  Field,
  TextArea,
  btnSecondary,
  labelClass,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function EditNoticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice) notFound();

  return (
    <div>
      <PageHeader
        title="Edit notice"
        action={
          <Link href="/notices" className={btnSecondary}>
            Back
          </Link>
        }
      />
      <Card className="p-6 max-w-2xl">
        <form action={updateNotice} className="space-y-3">
          <input type="hidden" name="id" value={notice.id} />
          <Field label="Title" name="title" defaultValue={notice.title} required />
          <TextArea label="Message" name="body" defaultValue={notice.body} rows={6} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="pinned"
              defaultChecked={notice.pinned}
              className="h-4 w-4 rounded border-gray-300 text-brand-600"
            />
            <span className={labelClass + " mb-0"}>Pin to top</span>
          </label>
          <SubmitButton>Save notice</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
