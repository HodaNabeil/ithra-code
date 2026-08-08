import { Role } from '@prisma/client';

import { auth } from '@/lib/auth';

import { AdminAccessError } from './admin-access.error';

export { AdminAccessError } from './admin-access.error';

export async function requireAdminSession() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    throw new AdminAccessError();
  }

  return session;
}
