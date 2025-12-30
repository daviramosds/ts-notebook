// app/actions.ts
'use server'
import { prisma } from "@/lib/prisma";


export async function getNotebook(id: string) {
  return await prisma.notebook.findUnique({
    where: { id },
    include: { user: true }
  });
}

export async function getNotebooks() {
  return await prisma.notebook.findMany({
    include: { user: true }
  });
}

export async function getPublicNotebook(id: string) {
  return await prisma.notebook.findUnique({
    where: { id, isPublic: true },
    include: { user: { select: { name: true } } }
  });
}

export async function saveNotebook(data: { id: string, name: string, cells: any[], theme: string, userId?: string }) {
  const content = { cells: data.cells, theme: data.theme };

  if (!data.userId && !data.id) throw new Error("User ID required for creation");

  await prisma.notebook.upsert({
    where: { id: data.id },
    update: {
      name: data.name,
      content: content as any,
      updated_at: new Date()
    },
    create: {
      id: data.id,
      name: data.name,
      content: content as any,
      userId: data.userId!
    }
  })
}

export async function deleteNotebook(id: string) {
  await prisma.notebook.delete({
    where: { id }
  });
}

export async function renameNotebook(id: string, name: string) {
  await prisma.notebook.update({
    where: { id },
    data: { name, updated_at: new Date() }
  });
}

export async function duplicateNotebook(id: string, userId: string) {
  const original = await prisma.notebook.findUnique({ where: { id } });
  if (!original) throw new Error("Notebook not found");

  const newId = crypto.randomUUID();
  const newNotebook = await prisma.notebook.create({
    data: {
      id: newId,
      name: `${original.name} (Copy)`,
      content: original.content as any,
      userId: userId,
      isPublic: false
    }
  });
  return newNotebook;
}

export async function toggleNotebookPublic(id: string, isPublic: boolean) {
  await prisma.notebook.update({
    where: { id },
    data: { isPublic }
  });
}