import "server-only";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export async function saveUploadedFile(file: File): Promise<{
  fileName: string;
  storedPath: string;
  mimeType: string;
}> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const storedPath = path.join(UPLOAD_DIR, unique);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(storedPath, bytes);
  return {
    fileName: file.name,
    storedPath,
    mimeType: file.type || "application/octet-stream",
  };
}
