'use server';

// Adicione estas importações no topo se não existirem
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// --- NOVAS AÇÕES DE USUÁRIO ---

// 1. Helper para pegar o ID do usuário logado via Cookie (Segurança)
async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const payload = await verifyJWT(token);
  return payload ? (payload.sub as string) : null;
}

export async function updateUserProfile(userId: string, name: string) {
  const authId = await getAuthenticatedUserId();
  if (!authId || authId !== userId) {
    throw new Error("Não autorizado");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name }
  });

  revalidatePath('/'); // Atualiza o nome no header da home
  revalidatePath('/settings');
}

export async function changePassword(userId: string, currentPass: string, newPass: string) {
  const authId = await getAuthenticatedUserId();
  if (!authId || authId !== userId) {
    throw new Error("Não autorizado");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuário não encontrado");

  // Verifica a senha atual
  const isValid = await bcrypt.compare(currentPass, user.password);
  if (!isValid) {
    throw new Error("A senha atual está incorreta.");
  }

  // Hash da nova senha
  const hashedPassword = await bcrypt.hash(newPass, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
}

export async function deleteAccount(userId: string) {
  const authId = await getAuthenticatedUserId();
  if (!authId || authId !== userId) {
    throw new Error("Não autorizado");
  }

  // O delete precisa ser em cascata ou deletar notebooks primeiro
  // Como no seu schema não vi 'onDelete: Cascade', vamos deletar manualmente
  await prisma.notebook.deleteMany({
    where: { userId: userId }
  });

  await prisma.user.delete({
    where: { id: userId }
  });

  // O logout será feito pelo client-side chamando a rota de logout
}