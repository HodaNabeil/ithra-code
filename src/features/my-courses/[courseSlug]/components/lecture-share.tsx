'use client';

import type { SVGProps } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Share2, Link2, Check } from 'lucide-react';
import { useState } from 'react';
import { extractErrorMessage } from '@/lib/error-extractor';

function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

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
          className="hover:bg-sidebar-accent!"
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

            {/* Twitter Share Button */}
            <button
              onClick={() => handleShare('twitter')}
              title="مشاركة على تويتر"
              className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-sidebar-accent transition-colors group"
            >
              <TwitterIcon className="w-5 h-5 text-muted-foreground group-hover:text-[#1DA1F2]" />
            </button>

            {/* Facebook Share Button */}
            <button
              onClick={() => handleShare('facebook')}
              title="مشاركة على فيسبوك"
              className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-sidebar-accent transition-colors group"
            >
              <FacebookIcon className="w-5 h-5 text-muted-foreground group-hover:text-[#1877F2]" />
            </button>

            {/* LinkedIn Share Button */}
            <button
              onClick={() => handleShare('linkedin')}
              title="مشاركة على لينكد إن"
              className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-sidebar-accent transition-colors group"
            >
              <LinkedinIcon className="w-5 h-5 text-muted-foreground group-hover:text-[#0A66C2]" />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
