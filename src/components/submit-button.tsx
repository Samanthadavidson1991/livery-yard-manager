"use client";

import { useFormStatus } from "react-dom";
import { btnPrimary } from "@/components/ui";

export function SubmitButton({
  children,
  className,
  pendingText,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className ?? btnPrimary} disabled={pending}>
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}
