'use server';

// Adicione estas importações no topo se não existirem
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
  // Removed revalidatePath to maintain SPA behavior
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

export async function updateUserPreferences(userId: string, preferences: { language?: string; theme?: string }) {
  const authId = await getAuthenticatedUserId();
  if (!authId || authId !== userId) {
    throw new Error("Not authorized");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(preferences.language && { language: preferences.language }),
      ...(preferences.theme && { theme: preferences.theme })
    }
  });
}

export async function updateUsername(userId: string, username: string) {
  const authId = await getAuthenticatedUserId();
  if (!authId || authId !== userId) {
    throw new Error("Not authorized");
  }

  // Validate username format (alphanumeric, underscores, 3-20 chars)
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    throw new Error("Username must be 3-20 characters and contain only letters, numbers, and underscores");
  }

  // Check if username is already taken
  const existing = await prisma.user.findUnique({
    where: { username }
  });

  if (existing && existing.id !== userId) {
    throw new Error("Username already taken");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { username }
  });
}