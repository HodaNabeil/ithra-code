'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function getUserAvatarLetter(
  name?: string | null,
  email?: string | null,
): string {
  const fromName = name?.trim().charAt(0);
  if (fromName) return fromName.toUpperCase();

  const fromEmail = email?.trim().charAt(0);
  if (fromEmail) return fromEmail.toUpperCase();

  return 'U';
}

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  className?: string;
}

export function UserAvatar({ name, email, image, className }: UserAvatarProps) {
  const letter = getUserAvatarLetter(name, email);
  const imageUrl = image?.trim() || null;

  return (
    <Avatar
      className={cn(
        'h-9 w-9 overflow-hidden after:hidden ring-1 ring-white/20',
        className,
      )}
    >
      {imageUrl ? <AvatarImage src={imageUrl} alt={name || 'User'} /> : null}
      <AvatarFallback
        suppressHydrationWarning
        className="bg-primary text-primary-foreground text-sm font-semibold"
      >
        {letter}
      </AvatarFallback>
    </Avatar>
  );
}
