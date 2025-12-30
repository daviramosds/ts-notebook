'use server'
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';

export type ShareSettings = {
  isEnabled: boolean;
  password: string | null;
  expiresAt: Date | null;
  accessType: 'public' | 'authenticated' | 'restricted';
  allowedEmails: string[];
};

export type AccessLog = {
  id: string;
  userEmail: string | null;
  userName: string | null;
  accessedAt: Date;
  ipAddress: string | null;
};

// Get current share settings for a notebook
export async function getShareSettings(notebookId: string) {
  const share = await prisma.notebookShare.findUnique({
    where: { notebookId },
    include: {
      notebook: { select: { name: true, userId: true } }
    }
  });

  if (!share) {
    return null;
  }

  return {
    id: share.id,
    isEnabled: share.isEnabled,
    hasPassword: !!share.password,
    expiresAt: share.expiresAt,
    accessType: share.accessType as 'public' | 'authenticated' | 'restricted',
    allowedEmails: share.allowedEmails,
    notebookName: share.notebook.name,
    createdAt: share.createdAt
  };
}

// Create or update share settings
export async function updateShareSettings(
  notebookId: string,
  settings: {
    isEnabled: boolean;
    password?: string | null;
    removePassword?: boolean;
    expiresAt?: Date | null;
    accessType: 'public' | 'authenticated' | 'restricted';
    allowedEmails?: string[];
  }
) {
  const existingShare = await prisma.notebookShare.findUnique({
    where: { notebookId }
  });

  // Hash password if provided
  let hashedPassword: string | null | undefined = undefined;
  if (settings.removePassword) {
    hashedPassword = null;
  } else if (settings.password) {
    hashedPassword = await bcrypt.hash(settings.password, 10);
  }

  if (existingShare) {
    // Update existing
    return await prisma.notebookShare.update({
      where: { notebookId },
      data: {
        isEnabled: settings.isEnabled,
        ...(hashedPassword !== undefined && { password: hashedPassword }),
        expiresAt: settings.expiresAt,
        accessType: settings.accessType,
        allowedEmails: settings.allowedEmails || []
      }
    });
  } else {
    // Create new
    return await prisma.notebookShare.create({
      data: {
        notebookId,
        isEnabled: settings.isEnabled,
        password: hashedPassword || null,
        expiresAt: settings.expiresAt || null,
        accessType: settings.accessType,
        allowedEmails: settings.allowedEmails || []
      }
    });
  }
}

// Disable sharing for a notebook
export async function disableShare(notebookId: string) {
  const existingShare = await prisma.notebookShare.findUnique({
    where: { notebookId }
  });

  if (existingShare) {
    await prisma.notebookShare.update({
      where: { notebookId },
      data: { isEnabled: false }
    });
  }
}

// Validate access to a shared notebook
export async function validateShareAccess(
  notebookId: string,
  options: {
    password?: string;
    userEmail?: string;
    userId?: string;
  } = {}
): Promise<{ allowed: boolean; reason?: string; shareId?: string }> {
  const share = await prisma.notebookShare.findUnique({
    where: { notebookId },
    include: { notebook: { select: { name: true } } }
  });

  // No share settings = not shared
  if (!share) {
    return { allowed: false, reason: 'not_shared' };
  }

  // Share disabled
  if (!share.isEnabled) {
    return { allowed: false, reason: 'disabled' };
  }

  // Check expiration
  if (share.expiresAt && new Date() > share.expiresAt) {
    return { allowed: false, reason: 'expired' };
  }

  // Check access type
  if (share.accessType === 'authenticated' && !options.userId) {
    return { allowed: false, reason: 'login_required' };
  }

  if (share.accessType === 'restricted') {
    if (!options.userEmail) {
      return { allowed: false, reason: 'login_required' };
    }
    if (!share.allowedEmails.includes(options.userEmail.toLowerCase())) {
      return { allowed: false, reason: 'not_authorized' };
    }
  }

  // Check password
  if (share.password) {
    if (!options.password) {
      return { allowed: false, reason: 'password_required', shareId: share.id };
    }
    const validPassword = await bcrypt.compare(options.password, share.password);
    if (!validPassword) {
      return { allowed: false, reason: 'wrong_password', shareId: share.id };
    }
  }

  return { allowed: true, shareId: share.id };
}

// Log access to a shared notebook
export async function logShareAccess(
  shareId: string,
  options: {
    userId?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
) {
  await prisma.notebookAccessLog.create({
    data: {
      shareId,
      userId: options.userId || null,
      userEmail: options.userEmail || null,
      ipAddress: options.ipAddress || null,
      userAgent: options.userAgent || null
    }
  });
}

// Get access logs for a notebook
export async function getAccessLogs(notebookId: string): Promise<AccessLog[]> {
  const share = await prisma.notebookShare.findUnique({
    where: { notebookId },
    include: {
      accessLogs: {
        orderBy: { accessedAt: 'desc' },
        take: 100,
        include: {
          user: { select: { name: true, email: true } }
        }
      }
    }
  });

  if (!share) return [];

  return share.accessLogs.map(log => ({
    id: log.id,
    userEmail: log.user?.email || log.userEmail || null,
    userName: log.user?.name || null,
    accessedAt: log.accessedAt,
    ipAddress: log.ipAddress
  }));
}

// Get shared notebook with validation
export async function getSharedNotebook(
  notebookId: string,
  options: {
    password?: string;
    userEmail?: string;
    userId?: string;
  } = {}
) {
  const validation = await validateShareAccess(notebookId, options);

  if (!validation.allowed) {
    return { error: validation.reason, shareId: validation.shareId };
  }

  const notebook = await prisma.notebook.findUnique({
    where: { id: notebookId },
    include: { user: { select: { name: true } } }
  });

  if (!notebook) {
    return { error: 'not_found' };
  }

  return { notebook, shareId: validation.shareId };
}
