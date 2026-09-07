'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AI_TUTOR_CONSTANTS } from '@/features/ai-tutor/shared';

export type TutorIndexingStatus =
  | 'ready'
  | 'indexing'
  | 'not_indexed'
  | 'failed';

export type TutorIndexingStatusBannerProps = {
  courseSlug: string;
  status: TutorIndexingStatus;
  failedJobs?: number;
};

const STATUS_COPY: Record<
  TutorIndexingStatus,
  { title: string; description: string; variant: 'default' | 'destructive' }
> = {
  ready: {
    title: 'قاعدة معرفة المدرس الذكي جاهزة',
    description: 'يمكن للطلاب الحصول على إجابات مستندة إلى محتوى الدورة.',
    variant: 'default',
  },
  indexing: {
    title: 'جاري فهرسة محتوى المدرس الذكي',
    description: 'قد يستغرق ذلك بضع دقائق بعد النشر أو التحديث.',
    variant: 'default',
  },
  not_indexed: {
    title: 'محتوى المدرس الذكي غير مفهرس بعد',
    description: 'سيظهر للطلاب رسالة تحضير حتى تكتمل الفهرسة.',
    variant: 'default',
  },
  failed: {
    title: 'فشلت فهرسة المدرس الذكي',
    description: 'تحقق من سجلات العامل أو أعد الفهرسة يدوياً.',
    variant: 'destructive',
  },
};

export function TutorIndexingStatusBanner({
  courseSlug,
  status,
  failedJobs = 0,
}: TutorIndexingStatusBannerProps) {
  const copy = STATUS_COPY[status];
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexMessage, setReindexMessage] = useState<string | null>(null);

  const handleReindex = async () => {
    setIsReindexing(true);
    setReindexMessage(null);

    try {
      const response = await fetch(AI_TUTOR_CONSTANTS.INDEX_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug }),
      });

      const payload = (await response.json()) as { message?: string };
      setReindexMessage(payload.message ?? 'تم طلب إعادة الفهرسة');
    } catch {
      setReindexMessage('فشل طلب إعادة الفهرسة');
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <Alert variant={copy.variant} className="mb-4">
      {status === 'ready' ? (
        <CheckCircle2 className="size-4" />
      ) : status === 'failed' ? (
        <AlertTriangle className="size-4" />
      ) : (
        <Loader2 className="size-4 animate-spin" />
      )}
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          {copy.description}
          {failedJobs > 0 ? ` (${failedJobs} مهمة فاشلة في الطابور)` : null}
        </p>
        {status !== 'ready' && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isReindexing}
            onClick={() => void handleReindex()}
          >
            {isReindexing ? 'جاري الطلب...' : 'إعادة فهرسة الدورة'}
          </Button>
        )}
        {reindexMessage && (
          <p className="text-xs text-muted-foreground">{reindexMessage}</p>
        )}
      </AlertDescription>
    </Alert>
  );
}
