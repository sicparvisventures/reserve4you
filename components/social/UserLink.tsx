'use client';

import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserLinkProps {
  consumerId: string;
  name: string;
  profilePictureUrl?: string | null;
  className?: string;
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md' | 'lg';
  variant?: 'link' | 'button' | 'text';
}

export function UserLink({
  consumerId,
  name,
  profilePictureUrl,
  className,
  showAvatar = false,
  avatarSize = 'sm',
  variant = 'link',
}: UserLinkProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarSizes = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  const content = (
    <>
      {showAvatar && (
        <Avatar className={cn(avatarSizes[avatarSize], 'mr-2')}>
          <AvatarImage src={profilePictureUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
      )}
      <span className={cn(
        variant === 'link' && 'hover:underline hover:text-primary transition-colors',
        variant === 'button' && 'font-medium'
      )}>
        {name}
      </span>
    </>
  );

  if (variant === 'text') {
    return (
      <Link
        href={`/profile/${consumerId}`}
        className={cn('inline-flex items-center', className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <Link
      href={`/profile/${consumerId}`}
      className={cn(
        'inline-flex items-center',
        variant === 'link' && 'text-foreground hover:text-primary',
        variant === 'button' && 'hover:bg-muted rounded px-2 py-1',
        className
      )}
    >
      {content}
    </Link>
  );
}

