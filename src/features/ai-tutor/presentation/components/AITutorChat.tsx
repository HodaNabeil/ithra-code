'use client';

import { useEffect, useRef } from 'react';
import { Bot, BookOpen, Loader2, RotateCcw, Send, Sparkles, Square, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { useAITutorChat, type ChatMessage } from '../hooks/use-ai-tutor-chat';
import { TutorMessageContent } from './TutorMessageContent';

export type AITutorChatProps = {
  courseSlug: string;
  lectureId?: string;
  lectureTitle?: string;
  courseTitle?: string;
  variant?: 'default' | 'sidebar';
};

export function AITutorChat({
  courseSlug,
  lectureId,
  lectureTitle,
  courseTitle,
  variant = 'default',
}: AITutorChatProps) {
  const {
    messages,
    input,
    setInput,
    sendMessage,
    retry,
    cancel,
    isStreaming,
    streamingMessageId,
    isLoadingHistory,
    error,
  } = useAITutorChat({
    courseSlug,
    lectureId,
    lectureTitle,
    courseTitle,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSidebar = variant === 'sidebar';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isStreaming]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div
      dir="rtl"
      className={cn(
        'flex min-h-0 flex-col overflow-hidden bg-card/20',
        isSidebar
          ? 'h-full rounded-none border-0'
          : 'h-[min(70vh,640px)] rounded-2xl border border-border/60',
      )}
    >
      {!isSidebar ? (
        <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="font-bold">المدرس الذكي</h3>
              <p className="text-sm text-muted-foreground">
                اسأل عن المحاضرة وسأجيبك فوراً
              </p>
            </div>
          </div>
          {isStreaming && <StreamingIndicator />}
        </div>
      ) : (
        isStreaming && (
          <div className="shrink-0 border-b border-border/40 bg-muted/20 px-4 py-2">
            <StreamingIndicator compact />
          </div>
        )
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div
          aria-live="polite"
          aria-atomic="false"
          className={cn('space-y-3', isSidebar ? 'px-3 py-3' : 'px-5 py-4')}
        >
          {isLoadingHistory ? (
            <LoadingState />
          ) : messages.length === 0 ? (
            <EmptyState lectureTitle={lectureTitle} compact={isSidebar} />
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isStreaming={message.id === streamingMessageId}
                compact={isSidebar}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {error && (
        <div
          className={cn(
            'mx-3 mb-2 flex items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive',
            !isSidebar && 'mx-5 mb-3 px-4 py-3',
          )}
        >
          <span className="min-w-0">{error}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-2"
            onClick={retry}
          >
            <RotateCcw className="size-4" />
            إعادة المحاولة
          </Button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={cn(
          'shrink-0 border-t border-border/50 bg-background/60 backdrop-blur-sm',
          isSidebar ? 'p-3' : 'p-4',
        )}
      >
        {isSidebar ? (
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك..."
              disabled={isStreaming || isLoadingHistory}
              rows={1}
              className="min-h-11 max-h-28 flex-1 resize-none rounded-xl border-border/60 bg-background px-3 py-2.5 text-sm"
              dir="auto"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isStreaming || isLoadingHistory || input.trim().length === 0}
              className="size-11 shrink-0 rounded-xl"
              aria-label="إرسال"
            >
              {isStreaming ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
            {isStreaming && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={cancel}
                className="size-11 shrink-0 rounded-xl"
                aria-label="إيقاف التوليد"
              >
                <Square className="size-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك هنا..."
              disabled={isStreaming || isLoadingHistory}
              className="min-h-22 flex-1 rounded-xl bg-background"
              dir="auto"
            />
            <div className="flex gap-2 md:self-end">
              {isStreaming && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancel}
                  className="h-11 gap-2 rounded-xl px-4"
                  aria-label="إيقاف التوليد"
                >
                  <Square className="size-4" />
                  إيقاف
                </Button>
              )}
              <Button
                type="submit"
                disabled={isStreaming || isLoadingHistory || input.trim().length === 0}
                className="h-11 gap-2 rounded-xl px-6"
              >
                {isStreaming ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                إرسال
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function StreamingIndicator({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-muted-foreground',
        compact ? 'text-xs' : 'text-sm',
      )}
    >
      <Loader2 className={cn('animate-spin', compact ? 'size-3.5' : 'size-4')} />
      <span>يكتب...</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center text-center">
      <Loader2 className="mb-3 size-7 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">جاري تحميل المحادثة...</p>
    </div>
  );
}

function EmptyState({
  lectureTitle,
  compact,
}: {
  lectureTitle?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'min-h-40 px-2 py-6' : 'min-h-70 px-4 py-10',
      )}
    >
      <div
        className={cn(
          'mb-3 flex items-center justify-center rounded-full bg-muted/50',
          compact ? 'size-12' : 'size-16',
        )}
      >
        <Bot
          className={cn(
            'text-muted-foreground/60',
            compact ? 'size-6' : 'size-8',
          )}
        />
      </div>
      <h4 className={cn('mb-1.5 font-bold', compact ? 'text-base' : 'text-lg')}>
        ابدأ محادثة مع المدرس الذكي
      </h4>
      <p className="max-w-xs text-sm leading-6 text-muted-foreground">
        اطرح سؤالك عن{' '}
        {lectureTitle ? `محاضرة "${lectureTitle}"` : 'المحاضرة'} وسأساعدك على
        الفهم خطوة بخطوة.
      </p>
    </div>
  );
}

function MessageBubble({
  message,
  isStreaming,
  compact,
}: {
  message: ChatMessage;
  isStreaming: boolean;
  compact?: boolean;
}) {
  const { role, content, sources, status } = message;
  const isUser = role === 'user';
  const hasContent = content.trim().length > 0;

  if (!isUser && !hasContent && !isStreaming) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'flex gap-2.5',
          isUser ? 'max-w-[85%] flex-row-reverse' : 'max-w-[92%] flex-row',
          compact && (isUser ? 'max-w-[90%]' : 'max-w-full'),
        )}
      >
        <div
          className={cn(
            'mt-0.5 flex shrink-0 items-center justify-center rounded-full',
            isUser
              ? 'size-7 bg-primary/15 text-primary'
              : 'size-7 bg-muted text-muted-foreground',
          )}
        >
          {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
        </div>

        <div className="min-w-0 space-y-2">
          <div
            className={cn(
              'min-w-0 rounded-2xl px-3.5 py-2.5 shadow-sm',
              isUser
                ? 'rounded-bl-md bg-primary text-primary-foreground'
                : 'rounded-br-md border border-border/50 bg-muted/40 text-foreground',
              status === 'failed' &&
                'border-destructive/30 bg-destructive/5 text-destructive',
            )}
          >
            {hasContent ? (
              isUser ? (
                <p className="whitespace-pre-wrap text-sm leading-7">{content}</p>
              ) : (
                <TutorMessageContent content={content} />
              )
            ) : isStreaming ? (
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                جاري التفكير...
              </span>
            ) : null}
          </div>

          {!isUser && sources && sources.length > 0 && (
            <MessageSources sources={sources} compact={compact} />
          )}
        </div>
      </div>
    </div>
  );
}

function MessageSources({
  sources,
  compact,
}: {
  sources: ChatMessage['sources'];
  compact?: boolean;
}) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border/40 bg-background/80 px-3 py-2',
        compact ? 'text-[11px]' : 'text-xs',
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5 font-medium text-muted-foreground">
        <BookOpen className="size-3.5 shrink-0" />
        <span>مصادر من الدورة</span>
      </div>
      <ul className="space-y-1">
        {sources.map((source) => (
          <li
            key={source.id}
            className="flex items-start justify-between gap-2 text-muted-foreground"
          >
            <span className="min-w-0 truncate">{source.title}</span>
            {source.relevanceScore > 0 && (
              <span className="shrink-0 tabular-nums text-[10px] opacity-70">
                {Math.round(source.relevanceScore * 100)}%
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
