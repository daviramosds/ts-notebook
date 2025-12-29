// app/actions.ts
'use server'
import { prisma } from "@/lib/prisma"; // Importe a instância corrigida


// Adicione isto em app/actions.ts
export async function getNotebook(id: string) {
  return await prisma.notebook.findUnique({
    where: { id },
    include: { user: true } // Opcional, se precisar de dados do usuário
  });
}

export async function getNotebooks() {
  return await prisma.notebook.findMany({
    include: { user: true } // Opcional, se precisar de dados do usuário
  });
}


export async function saveNotebook(data: { id: string, name: string, cells: any[], theme: string, userId?: string }) {
  const content = { cells: data.cells, theme: data.theme };

  // Verifica se userId foi passado (idealmente viria do token de sessão seguro)
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
      // Usa o ID passado ou lança erro. Removido o MOCK_USER_ID
      userId: data.userId!
    }
  })
  // Removed revalidatePath to maintain SPA behavior without page refreshes
}