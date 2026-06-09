import { requireModule } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { uploadDocument, deleteDocument } from "@/lib/actions/documents";
import {
  Card,
  PageHeader,
  Badge,
  EmptyState,
  inputClass,
  labelClass,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { DocumentsSection } from "@/components/documents-section";

export default async function DocumentsPage() {
  const user = await requireModule("documents");

  if (user.role !== "ADMIN") {
    const documents = await prisma.document.findMany({
      where: { liveryId: user.liveryId ?? "__none__" },
      orderBy: { createdAt: "desc" },
    });
    return (
      <div>
        <PageHeader title="Documents" subtitle="Your insurance docs, photos and bills" />
        <div className="max-w-2xl">
          <DocumentsSection documents={documents} liveryId={user.liveryId ?? undefined} />
        </div>
      </div>
    );
  }

  // Admin view: all documents + upload for any livery
  const [documents, liveries] = await Promise.all([
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      include: { livery: true, horse: true },
    }),
    prisma.livery.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Documents" subtitle="All documents across the yard" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            {documents.length === 0 ? (
              <EmptyState title="No documents yet" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between px-5 py-3 gap-3">
                    <div className="min-w-0">
                      <a
                        href={`/api/documents/${d.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-brand-700 hover:underline"
                      >
                        {d.title}
                      </a>
                      <p className="text-xs text-gray-400">
                        {d.livery.name}
                        {d.horse ? ` · ${d.horse.name}` : ""} ·{" "}
                        {d.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge color="gray">{d.type}</Badge>
                      <form action={deleteDocument}>
                        <input type="hidden" name="id" value={d.id} />
                        <button className="text-sm text-red-600 hover:underline">Delete</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="font-semibold text-brand-900 mb-4">Upload document</h2>
          <form action={uploadDocument} className="space-y-3">
            <label className="block">
              <span className={labelClass}>Livery account</span>
              <select name="liveryId" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Select a livery…
                </option>
                {liveries.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Title</span>
              <input className={inputClass} name="title" placeholder="e.g. Monthly invoice" />
            </label>
            <label className="block">
              <span className={labelClass}>Type</span>
              <select name="type" className={inputClass} defaultValue="OTHER">
                <option value="INSURANCE">Insurance</option>
                <option value="PHOTO">Photo</option>
                <option value="BILL">Bill</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>File</span>
              <input className={inputClass} type="file" name="file" required />
            </label>
            <SubmitButton pendingText="Uploading…">Upload</SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
