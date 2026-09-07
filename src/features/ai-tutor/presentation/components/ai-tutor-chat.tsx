'use client';

import { useCallback, useRef } from 'react';
import {
  ChatContainer,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
} from '@chatscope/chat-ui-kit-react';
import { Bot, Loader2, RotateCcw, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  shouldRenderMessage,
  toChatscopeMessageModel,
} from '../adapters/chatscope-message.adapter';
import { useAITutorChat, type ChatMessage } from '../hooks/use-ai-tutor-chat';
import '../styles/ai-tutor-chatscope.css';
import { TutorMessageContent } from './tutor-message-content';

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

  const isSidebar = variant === 'sidebar';
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const sidebarScrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSidebarScroll = useCallback(() => {
    const element = sidebarScrollRef.current;
    if (!element) {
      return;
    }

    element.dataset.scrolling = 'true';
    clearTimeout(sidebarScrollTimeoutRef.current);
    sidebarScrollTimeoutRef.current = setTimeout(() => {
      delete element.dataset.scrolling;
    }, 900);
  }, []);

  const handleSend = (
    _innerHtml: string,
    textContent: string,
    _innerText: string,
    _nodes: NodeList,
  ) => {
    const question = textContent.trim();
    if (!question || isStreaming || isLoadingHistory) {
      return;
    }

    void sendMessage(question);
  };

  const visibleMessages = messages.filter((message) =>
    shouldRenderMessage(message, streamingMessageId),
  );

  const messageList = (
    <>
      {visibleMessages.map((message) => (
        <ChatscopeMessageRow
          key={message.id}
          message={message}
          isStreaming={message.id === streamingMessageId}
          bare={isSidebar}
        />
      ))}
    </>
  );

  const messageArea = isLoadingHistory ? (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col',
        isSidebar ? 'px-3 py-4' : 'px-5 py-6',
      )}
    >
      <LoadingState />
    </div>
  ) : messages.length === 0 ? (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col',
        isSidebar ? 'px-3 py-4' : 'px-5 py-6',
      )}
    >
      <EmptyState lectureTitle={lectureTitle} compact={isSidebar} />
    </div>
  ) : isSidebar ? (
    <div className="flex flex-col gap-4 px-3 py-4">{messageList}</div>
  ) : (
    <MessageList
      className="px-5 py-5"
      autoScrollToBottom
      autoScrollToBottomOnMount
      scrollBehavior="smooth"
      aria-live="polite"
      aria-atomic="false"
    >
      {messageList}
    </MessageList>
  );

  const errorBanner = error ? (
    <div
      className={cn(
        'mx-3 mb-2 flex items-center justify-between gap-3 rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-sm text-destructive',
        !isSidebar && 'mx-5 mb-3 px-4 py-3',
      )}
    >
      <span className="min-w-0 leading-relaxed">{error}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 gap-2 border-destructive/30 hover:bg-destructive/10"
        onClick={retry}
      >
        <RotateCcw className="size-4" />
        إعادة المحاولة
      </Button>
    </div>
  ) : null;

  const inputRow = (
    <div className="ai-tutor-input-row shrink-0">
      {isStreaming && (
        <Button
          type="button"
          size={isSidebar ? 'icon' : 'default'}
          variant="outline"
          onClick={cancel}
          className={cn(
            'shrink-0 border-brand/25 bg-brand/10 text-brand hover:bg-brand/15 hover:text-brand',
            isSidebar ? 'size-11 rounded-full' : 'h-11 gap-2 rounded-full px-4',
          )}
          aria-label="إيقاف التوليد"
        >
          <span
            className="size-3.5 shrink-0 rounded-sm bg-brand"
            aria-hidden
          />
          {!isSidebar && 'إيقاف'}
        </Button>
      )}
      <MessageInput
        value={input}
        onChange={(_innerHtml, textContent) => setInput(textContent)}
        onSend={handleSend}
        placeholder={isSidebar ? 'اكتب سؤالك...' : 'اكتب سؤالك هنا...'}
        disabled={isStreaming || isLoadingHistory}
        sendDisabled={
          isStreaming || isLoadingHistory || input.trim().length === 0
        }
        attachButton={false}
        sendOnReturnDisabled={false}
      />
    </div>
  );

  const chatBody = isSidebar ? (
    <div className="ai-tutor-sidebar-body flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={sidebarScrollRef}
        onScroll={handleSidebarScroll}
        className="sidebar-scroll min-h-0 flex-1"
      >
        {messageArea}
      </div>
      {errorBanner}
      {inputRow}
    </div>
  ) : (
    <MainContainer className="min-h-0 flex-1">
      <ChatContainer className="min-h-0">
        {messageArea}
        {errorBanner}
        {inputRow}
      </ChatContainer>
    </MainContainer>
  );

  return (
    <div
      dir="rtl"
      className={cn(
        'ai-tutor-chatscope w-full overflow-hidden',
        isSidebar &&
          'is-sidebar grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] rounded-none border-0',
        !isSidebar &&
          'flex h-[min(70vh,640px)] min-h-0 flex-col rounded-2xl border border-border/60 shadow-sm',
      )}
    >
      {!isSidebar ? (
        <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="font-bold tracking-tight">المدرس الذكي</h3>
              <p className="text-sm text-muted-foreground">
                اسأل عن المحاضرة وسأجيبك فوراً
              </p>
            </div>
          </div>
          {isStreaming && <StreamingIndicator />}
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-brand/15">
              <Sparkles className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">
                المدرس الذكي
              </p>
              {lectureTitle && (
                <p className="truncate text-[11px] text-muted-foreground">
                  {lectureTitle}
                </p>
              )}
            </div>
          </div>
          {isStreaming && <StreamingIndicator compact />}
        </div>
      )}

      {chatBody}
    </div>
  );
}

function ChatscopeMessageRow({
  message,
  isStreaming,
  bare = false,
}: {
  message: ChatMessage;
  isStreaming: boolean;
  bare?: boolean;
}) {
  const isUser = message.role === 'user';
  const hasContent = message.content.trim().length > 0;
  const isFailed = message.status === 'failed';

  const row = (
    <div
      className={cn(
        'ai-tutor-message-row',
        isUser
          ? 'ai-tutor-message-row--user'
          : 'ai-tutor-message-row--assistant',
        isUser && 'ms-auto',
      )}
    >
      <div
        className={cn(
          'ai-tutor-message-avatar',
          isUser
            ? 'ai-tutor-message-avatar--user'
            : 'ai-tutor-message-avatar--assistant',
        )}
      >
        {isUser ? (
          <User className="size-3.5" />
        ) : (
          <Bot className="size-3.5" />
        )}
      </div>

      <div className="ai-tutor-message-body">
        <div
          className={cn(
            'ai-tutor-message-bubble',
            isUser
              ? 'ai-tutor-message-bubble--user'
              : 'ai-tutor-message-bubble--assistant',
            isFailed && 'ai-tutor-message-bubble--failed',
          )}
        >
          {hasContent ? (
            isUser ? (
              <p className="whitespace-pre-wrap text-sm leading-7">
                {message.content}
              </p>
            ) : (
              <TutorMessageContent content={message.content} />
            )
          ) : isStreaming ? (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              جاري التفكير...
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (bare) {
    return row;
  }

  return (
    <Message model={toChatscopeMessageModel(message)}>
      <Message.CustomContent>{row}</Message.CustomContent>
    </Message>
  );
}

function StreamingIndicator({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-brand',
        compact ? 'text-[11px]' : 'text-xs',
      )}
    >
      <Loader2
        className={cn('animate-spin', compact ? 'size-3' : 'size-3.5')}
      />
      <span className="font-medium">يكتب...</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted/40">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">
        جاري تحميل المحادثة...
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        يتم جلب سجل الأسئلة والأجوبة
      </p>
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
          'mb-4 flex items-center justify-center rounded-2xl bg-brand/10 ring-1 ring-brand/15',
          compact ? 'size-14' : 'size-16',
        )}
      >
        <Bot className={cn('text-brand', compact ? 'size-7' : 'size-8')} />
      </div>
      <h4
        className={cn(
          'mb-2 font-bold tracking-tight',
          compact ? 'text-base' : 'text-lg',
        )}
      >
        ابدأ محادثة مع المدرس الذكي
      </h4>
      <p className="max-w-xs text-sm leading-6 text-muted-foreground">
        اطرح سؤالك عن{' '}
        {lectureTitle ? (
          <span className="font-medium text-foreground/80">
            محاضرة «{lectureTitle}»
          </span>
        ) : (
          'المحاضرة'
        )}{' '}
        وسأساعدك على الفهم خطوة بخطوة.
      </p>
    </div>
  );
}
