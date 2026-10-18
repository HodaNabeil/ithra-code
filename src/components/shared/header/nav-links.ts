import { APP_LINK_ROLES, APP_ROUTES, APP_USER_ROLES } from '@/constants/enums';
import type { Session } from 'next-auth';

export const NAV_LINKS = [
  {
    label: 'الدورات',
    href: APP_ROUTES.COURSES,
    role: APP_LINK_ROLES.ALL,
  },
  {
    label: 'مسارات التعلم',
    href: APP_ROUTES.LEARNING_PATHS,
    role: APP_LINK_ROLES.ALL,
  },
  {
    label: 'تواصل معنا',
    href: APP_ROUTES.CONTACT,
    role: APP_LINK_ROLES.ALL,
  },
  {
    label: 'دوراتي',
    href: APP_ROUTES.MY_COURSES,
    role: APP_LINK_ROLES.STUDENT,
  },
  {
    label: 'Admin',
    href: APP_ROUTES.ADMIN,
    role: APP_LINK_ROLES.ADMIN,
  },
] as const;

export function filterNavLinks(session: Session | null) {
  const userRole = session?.user?.role;

  return NAV_LINKS.filter((link) => {
    if (link.role === APP_LINK_ROLES.ALL) return true;
    if (link.role === APP_LINK_ROLES.ADMIN && userRole === APP_USER_ROLES.ADMIN)
      return true;
    if (link.role === APP_LINK_ROLES.STUDENT && session?.user) return true;
    return false;
  });
}
