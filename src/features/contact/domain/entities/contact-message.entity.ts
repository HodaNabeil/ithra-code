import type { ContactMessageStatus } from '@/generated/prisma/enums';

export type { ContactMessageStatus };

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateContactMessageInput = {
  name: string;
  email: string;
  message: string;
};
