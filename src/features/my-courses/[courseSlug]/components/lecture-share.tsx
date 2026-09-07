'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  FacebookIcon,
  LinkedInIcon,
  XIcon,
} from '@/components/shared/social-icons';
import { Share2, Link2, Check } from 'lucide-react';
import { useState } from 'react';
import { extractErrorMessage } from '@/lib/error-extractor';

export default function LectureShare({ courseTitle }: { courseTitle: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(
        'Failed to copy:',
        extractErrorMessage(err, 'Failed to copy link'),
      );
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(courseTitle);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-transparent! dark:hover:bg-transparent! hover:text-primary transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-4" align="end">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            شارك هذه المحاضرة
          </h3>

          <div className="grid grid-cols-4 gap-2">
            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              title={copied ? 'تم نسخ الرابط!' : 'نسخ الرابط'}
              className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-sidebar-accent transition-colors group"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Link2 className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              )}
            </button>

            {/* X Share Button */}
            <button
              onClick={() => handleShare('twitter')}
              title="مشاركة على X"
              className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-sidebar-accent transition-colors group"
            >
              <XIcon className="size-4.5 text-muted-foreground group-hover:text-foreground" />
            </button>

            {/* Facebook Share Button */}
            <button
              onClick={() => handleShare('facebook')}
              title="مشاركة على فيسبوك"
              className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-sidebar-accent transition-colors group"
            >
              <FacebookIcon className="size-4.5 text-muted-foreground group-hover:text-[#1877F2]" />
            </button>

            {/* LinkedIn Share Button */}
            <button
              onClick={() => handleShare('linkedin')}
              title="مشاركة على لينكد إن"
              className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-sidebar-accent transition-colors group"
            >
              <LinkedInIcon className="size-4.5 text-muted-foreground group-hover:text-[#0A66C2]" />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
