'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { MessageSourceDTO } from '../../application/dto/message-source.dto';
import { AI_TUTOR_CONSTANTS } from '../../shared';
import {
  parseTutorSseEvent,
  type TutorSseEvent,
} from '../../shared/sse-protocol';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  turnId?: string;
  sources?: MessageSourceDTO[];
};

export type UseAITutorChatOptions = {
  courseSlug: string;
  lectureId?: string;
  lectureTitle?: string;
  courseTitle?: string;
};

type StreamState = 'idle' | 'streaming' | 'error';

type ThreadMessagesResponse = {
  success: boolean;
  message: string;
  data: {
    threadId: string | null;
    conversationId: string | null;
    messages: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      status?: ChatMessage['status'];
      turnId?: string;
      sources?: MessageSourceDTO[];
    }>;
  };
};

type StreamMeta = {
  threadId?: string;
  conversationId?: string;
  turnId?: string;
  userMessageId?: string;
  assistantMessageId?: string;
  sources: MessageSourceDTO[];
  usedFallback: boolean;
};

function createMessageId(): string {
  return crypto.randomUUID();
}

function formatHistoryMessage(message: ThreadMessagesResponse['data']['messages'][number]): ChatMessage {
  const status = message.status ?? 'completed';
  let content = message.content;

  if (message.role === 'assistant') {
    if (status === 'pending' && !content.trim()) {
      content = 'جاري توليد الرد...';
    } else if ((status === 'failed' || status === 'cancelled') && !content.trim()) {
      content = 'تعذر إكمال الرد';
    }
  }

  return {
    id: message.id,
    role: message.role,
    content,
    status,
    turnId: message.turnId,
    sources: message.sources,
  };
}

function sanitizeHistoryMessages(
  messages: ThreadMessagesResponse['data']['messages'],
): ThreadMessagesResponse['data']['messages'] {
  const withoutFailedPlaceholders = messages.filter((message) => {
    if (message.role !== 'assistant') {
      return true;
    }

    const status = message.status ?? 'completed';
    return !(
      (status === 'failed' || status === 'cancelled') &&
      !message.content.trim()
    );
  });

  const deduped: ThreadMessagesResponse['data']['messages'] = [];

  for (let index = 0; index < withoutFailedPlaceholders.length; index += 1) {
    const message = withoutFailedPlaceholders[index];
    if (!message) {
      continue;
    }

    if (message.role === 'user') {
      const hasLaterDuplicate = withoutFailedPlaceholders
        .slice(index + 1)
        .some(
          (laterMessage) =>
            laterMessage.role === 'user' &&
            laterMessage.content.trim() === message.content.trim(),
        );

      if (hasLaterDuplicate) {
        const nextMessage = withoutFailedPlaceholders[index + 1];
        if (nextMessage?.role === 'assistant') {
          index += 1;
        }
        continue;
      }
    }

    deduped.push(message);
  }

  return deduped;
}

function buildThreadQuery(options: UseAITutorChatOptions): string {
  const params = new URLSearchParams({
    courseSlug: options.courseSlug,
  });

  if (options.lectureId) {
    params.set('lectureId', options.lectureId);
  }

  if (options.lectureTitle) {
    params.set('lectureTitle', options.lectureTitle);
  }

  return params.toString();
}

function parseStreamMeta(event: TutorSseEvent): StreamMeta | null {
  if (event.type !== 'meta') {
    return null;
  }

  return {
    sources: event.sources,
    usedFallback: event.usedFallback,
    threadId: event.threadId,
    conversationId: event.conversationId,
    turnId: event.turnId,
    userMessageId: event.userMessageId,
    assistantMessageId: event.assistantMessageId,
  };
}

async function streamTutorResponse(params: {
  question: string;
  options: UseAITutorChatOptions;
  assistantMessageId: string;
  signal: AbortSignal;
  onMeta: (assistantMessageId: string, meta: StreamMeta) => void;
  onToken: (assistantMessageId: string, token: string) => void;
  onReplace: (assistantMessageId: string, text: string) => void;
  onComplete: () => void;
}): Promise<void> {
  const response = await fetch(`${AI_TUTOR_CONSTANTS.API_BASE_PATH}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: params.question,
      courseSlug: params.options.courseSlug,
      lectureId: params.options.lectureId,
      lectureTitle: params.options.lectureTitle,
      courseTitle: params.options.courseTitle,
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    let message = 'فشل إرسال السؤال';
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore JSON parse errors and use the default message.
    }

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error('لم يتم استلام رد من الخادم');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const rawEvent of events) {
      const line = rawEvent.trim();
      if (!line.startsWith('data: ')) {
        continue;
      }

      const payload = line.slice(6);
      const sseEvent = parseTutorSseEvent(payload);
      if (!sseEvent) {
        continue;
      }

      if (sseEvent.type === 'done') {
        params.onComplete();
        continue;
      }

      if (sseEvent.type === 'error') {
        throw new Error(sseEvent.message || 'حدث خطأ أثناء توليد الرد');
      }

      const meta = parseStreamMeta(sseEvent);
      if (meta) {
        params.onMeta(params.assistantMessageId, meta);
        continue;
      }

      if (sseEvent.type === 'replace') {
        params.onReplace(params.assistantMessageId, sseEvent.text);
        continue;
      }

      if (sseEvent.type === 'token') {
        params.onToken(params.assistantMessageId, sseEvent.text);
      }
    }
  }

  params.onComplete();
}

export function useAITutorChat(options: UseAITutorChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingAssistantIdRef = useRef<string | null>(null);

  const isStreaming = streamState === 'streaming';

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      setIsLoadingHistory(true);
      setError(null);

      try {
        const response = await fetch(
          `${AI_TUTOR_CONSTANTS.THREADS_ENDPOINT}?${buildThreadQuery(options)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          let message = 'فشل تحميل سجل المحادثة';
          try {
            const payload = (await response.json()) as { message?: string };
            if (payload.message) {
              message = payload.message;
            }
          } catch {
            // Ignore JSON parse errors and use the default message.
          }

          throw new Error(message);
        }

        const payload = (await response.json()) as ThreadMessagesResponse;
        setMessages(
          sanitizeHistoryMessages(payload.data.messages).map(formatHistoryMessage),
        );
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return;
        }

        const message =
          requestError instanceof Error
            ? requestError.message
            : 'فشل تحميل سجل المحادثة';

        setError(message);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadHistory();

    return () => {
      controller.abort();
    };
  }, [options.courseSlug, options.lectureId, options.lectureTitle]);

  const appendToken = useCallback((_assistantMessageId: string, token: string) => {
    const targetId = streamingAssistantIdRef.current;
    if (!targetId) {
      return;
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === targetId
          ? { ...message, content: message.content + token, status: 'pending' }
          : message,
      ),
    );
  }, []);

  const applyMeta = useCallback(
    (assistantMessageId: string, meta: StreamMeta) => {
      if (meta.assistantMessageId) {
        streamingAssistantIdRef.current = meta.assistantMessageId;
        setStreamingMessageId(meta.assistantMessageId);
      }

      setMessages((current) => {
        const assistantIndex = current.findIndex(
          (message) => message.id === assistantMessageId,
        );

        return current.map((message, index) => {
          if (message.id === assistantMessageId) {
            return {
              ...message,
              id: meta.assistantMessageId ?? message.id,
              turnId: meta.turnId ?? message.turnId,
              sources: meta.sources.length > 0 ? meta.sources : undefined,
            };
          }

          if (
            meta.userMessageId &&
            assistantIndex > 0 &&
            index === assistantIndex - 1 &&
            message.role === 'user'
          ) {
            return {
              ...message,
              id: meta.userMessageId,
              turnId: meta.turnId ?? message.turnId,
            };
          }

          return message;
        });
      });
    },
    [],
  );

  const replaceContent = useCallback((_assistantMessageId: string, text: string) => {
    const targetId = streamingAssistantIdRef.current;
    if (!targetId) {
      return;
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === targetId
          ? { ...message, content: text, status: 'pending' }
          : message,
      ),
    );
  }, []);

  const markStreamingComplete = useCallback(() => {
    const targetId = streamingAssistantIdRef.current;
    if (!targetId) {
      return;
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === targetId
          ? { ...message, status: 'completed' }
          : message,
      ),
    );
    streamingAssistantIdRef.current = null;
  }, []);

  const runQuestion = useCallback(
    async (question: string, requestOptions: { includeUserMessage: boolean }) => {
      const assistantMessageId = createMessageId();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        status: 'pending',
      };

      streamingAssistantIdRef.current = assistantMessageId;

      if (requestOptions.includeUserMessage) {
        const userMessage: ChatMessage = {
          id: createMessageId(),
          role: 'user',
          content: question,
        };

        setMessages((current) => [...current, userMessage, assistantMessage]);
      } else {
        setMessages((current) => [...current, assistantMessage]);
      }

      setError(null);
      setStreamState('streaming');
      setStreamingMessageId(assistantMessageId);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await streamTutorResponse({
          question,
          options,
          assistantMessageId,
          signal: controller.signal,
          onMeta: applyMeta,
          onToken: appendToken,
          onReplace: replaceContent,
          onComplete: () => {
            markStreamingComplete();
            setStreamState('idle');
            setStreamingMessageId(null);
          },
        });
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          setStreamState('idle');
          setStreamingMessageId(null);
          return;
        }

        const message =
          requestError instanceof Error
            ? requestError.message
            : 'حدث خطأ غير متوقع';

        setError(message);
        setStreamState('error');
        setMessages((current) =>
          current.filter(
            (message) =>
              message.id !== assistantMessageId || message.content.trim().length > 0,
          ),
        );
      } finally {
        abortControllerRef.current = null;
        setStreamingMessageId(null);
      }
    },
    [appendToken, applyMeta, markStreamingComplete, options, replaceContent],
  );

  const sendMessage = useCallback(async () => {
    const question = input.trim();
    if (!question || isStreaming || isLoadingHistory) {
      return;
    }

    setInput('');
    await runQuestion(question, { includeUserMessage: true });
  }, [input, isLoadingHistory, isStreaming, runQuestion]);

  const retry = useCallback(async () => {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
    if (!lastUserMessage || isStreaming || isLoadingHistory) {
      return;
    }

    setMessages((current) => {
      const lastUserIndex = current.findIndex((message) => message.id === lastUserMessage.id);
      return current.slice(0, lastUserIndex + 1);
    });

    await runQuestion(lastUserMessage.content, { includeUserMessage: false });
  }, [isLoadingHistory, isStreaming, messages, runQuestion]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    streamingAssistantIdRef.current = null;
    setStreamState('idle');
    setStreamingMessageId(null);
  }, []);

  return {
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
  };
}
