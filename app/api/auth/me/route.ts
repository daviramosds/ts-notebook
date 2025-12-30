// app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const payload = await verifyJWT(token);

  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Busca dados frescos no banco
  const user = await prisma.user.findUnique({
    where: { id: payload.sub as string },
    select: { id: true, name: true, email: true, username: true, language: true, theme: true }
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}