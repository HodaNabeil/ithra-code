import React from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { APP_ROUTES } from '@/constants/enums';

interface PathDownloadProps {
  slug: string;
}

export function PathDownload({ slug }: PathDownloadProps) {
  return (
    <div className="pt-8 text-right bg-background py-4 px-4">
      <Link
        target="_blank"
        href={`${APP_ROUTES.LEARNING_PATHS}/${slug}`}
        className="flex gap-[20px] bg-white w-fit text-[darkgreen] p-[12px] rounded-[4px] items-center"
      >
        <Download className="w-4 h-4" />
        تحميل Roadmap
      </Link>
    </div>
  );
}
