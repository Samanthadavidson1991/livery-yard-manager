"use client";

import { useState } from "react";
import { updatePost, deletePost } from "@/lib/actions/forums";
import { inputClass, btnPrimary } from "@/components/ui";

export function EditablePost({
  id,
  forumId,
  body,
  authorName,
  date,
  canEdit,
}: {
  id: string;
  forumId: string;
  body: string;
  authorName: string;
  date: string;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-800">{authorName}</p>
        <p className="text-xs text-gray-400">{date}</p>
      </div>

      {editing ? (
        <form
          action={updatePost}
          className="space-y-2"
          onSubmit={() => setEditing(false)}
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="forumId" value={forumId} />
          <textarea name="body" defaultValue={body} rows={3} className={inputClass} />
          <div className="flex gap-2">
            <button type="submit" className={btnPrimary}>
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-gray-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{body}</p>
      )}

      {canEdit && !editing && (
        <div className="flex gap-3 mt-2">
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-brand-700 hover:underline"
          >
            Edit
          </button>
          <form action={deletePost}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="forumId" value={forumId} />
            <button className="text-sm text-red-600 hover:underline">Delete</button>
          </form>
        </div>
      )}
    </div>
  );
}
