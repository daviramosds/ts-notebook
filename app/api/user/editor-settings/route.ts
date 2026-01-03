import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEFAULT_EDITOR_SETTINGS, validateEditorSettings, type EditorSettings } from '@/lib/editor-settings';

// Get editor settings
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.sub as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { editorSettings: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user settings or defaults
    const settings = user.editorSettings
      ? validateEditorSettings(user.editorSettings as Partial<EditorSettings>)
      : DEFAULT_EDITOR_SETTINGS;

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching editor settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update editor settings
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.sub as string;

    const body = await req.json();
    const validatedSettings = validateEditorSettings(body.settings);

    // Update only the user's own settings
    await prisma.user.update({
      where: { id: userId },
      data: { editorSettings: validatedSettings as any }
    });

    return NextResponse.json({
      success: true,
      settings: validatedSettings
    });
  } catch (error) {
    console.error('Error updating editor settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Reset to defaults
export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.sub as string;

    // Reset only the user's own settings
    await prisma.user.update({
      where: { id: userId },
      data: { editorSettings: DEFAULT_EDITOR_SETTINGS as any }
    });

    return NextResponse.json({
      success: true,
      settings: DEFAULT_EDITOR_SETTINGS
    });
  } catch (error) {
    console.error('Error resetting editor settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
