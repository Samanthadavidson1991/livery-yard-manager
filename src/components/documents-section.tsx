import { Card, Badge, inputClass, labelClass } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { uploadDocument, deleteDocument } from "@/lib/actions/documents";

type Doc = {
  id: string;
  title: string;
  fileName: string;
  type: string;
  mimeType: string;
  createdAt: Date;
};

const typeColors: Record<string, "blue" | "amber" | "green" | "gray"> = {
  INSURANCE: "blue",
  BILL: "amber",
  PHOTO: "green",
  OTHER: "gray",
};

export function DocumentsSection({
  documents,
  liveryId,
  horseId,
  title = "Documents",
  hint = "Insurance docs, photos, bills and more.",
}: {
  documents: Doc[];
  liveryId?: string;
  horseId?: string;
  title?: string;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <h2 className="font-semibold text-brand-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 mb-4">{hint}</p>

      {documents.length === 0 ? (
        <p className="text-sm text-gray-500 mb-4">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 mb-4">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2 gap-3">
              <div className="min-w-0">
                <a
                  href={`/api/documents/${d.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-700 hover:underline truncate block"
                >
                  {d.title}
                </a>
                <p className="text-xs text-gray-400">
                  {d.fileName} · {d.createdAt.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge color={typeColors[d.type] ?? "gray"}>{d.type}</Badge>
                <form action={deleteDocument}>
                  <input type="hidden" name="id" value={d.id} />
                  <button className="text-sm text-red-600 hover:underline">Delete</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={uploadDocument} className="space-y-3 border-t border-gray-100 pt-4">
        {liveryId && <input type="hidden" name="liveryId" value={liveryId} />}
        {horseId && <input type="hidden" name="horseId" value={horseId} />}
        <p className="text-sm font-medium text-gray-700">Upload a document</p>
        <label className="block">
          <span className={labelClass}>Title</span>
          <input className={inputClass} name="title" placeholder="e.g. Insurance certificate" />
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
  );
}
