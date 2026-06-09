"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import type { User } from "@prisma/client";

// Whether a user can read/post in a forum.
export async function userCanAccessForum(
  user: User,
  forumId: string,
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  const forum = await prisma.forum.findUnique({ where: { id: forumId } });
  if (!forum) return false;
  if (forum.isCentral) return true;
  if (!user.liveryId) return false;
  const member = await prisma.forumMember.findUnique({
    where: { forumId_liveryId: { forumId, liveryId: user.liveryId } },
  });
  return !!member;
}

export async function createForum(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.forum.create({
    data: {
      name,
      description: String(formData.get("description") ?? "").trim() || null,
      isCentral: formData.get("isCentral") === "on",
    },
  });
  revalidatePath("/forums");
  revalidatePath("/admin/forums");
}

export async function deleteForum(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.forum.delete({ where: { id } });
  revalidatePath("/forums");
  revalidatePath("/admin/forums");
}

export async function addForumMember(formData: FormData) {
  await requireAdmin();
  const forumId = String(formData.get("forumId"));
  const liveryId = String(formData.get("liveryId"));
  if (!liveryId) return;
  await prisma.forumMember.upsert({
    where: { forumId_liveryId: { forumId, liveryId } },
    update: {},
    create: { forumId, liveryId },
  });
  revalidatePath(`/admin/forums/${forumId}`);
}

export async function removeForumMember(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const forumId = String(formData.get("forumId"));
  await prisma.forumMember.delete({ where: { id } });
  revalidatePath(`/admin/forums/${forumId}`);
}

export async function createPost(formData: FormData) {
  const user = await requireUser();
  const forumId = String(formData.get("forumId"));
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  if (!(await userCanAccessForum(user, forumId))) redirect("/forums");
  await prisma.forumPost.create({
    data: { forumId, authorId: user.id, body },
  });
  revalidatePath(`/forums/${forumId}`);
}

export async function updatePost(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const forumId = String(formData.get("forumId"));
  const body = String(formData.get("body") ?? "").trim();
  const post = await prisma.forumPost.findUnique({ where: { id } });
  if (!post) return;
  if (user.role !== "ADMIN" && post.authorId !== user.id) return;
  await prisma.forumPost.update({ where: { id }, data: { body } });
  revalidatePath(`/forums/${forumId}`);
}

export async function deletePost(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const forumId = String(formData.get("forumId"));
  const post = await prisma.forumPost.findUnique({ where: { id } });
  if (!post) return;
  if (user.role !== "ADMIN" && post.authorId !== user.id) return;
  await prisma.forumPost.delete({ where: { id } });
  revalidatePath(`/forums/${forumId}`);
}
