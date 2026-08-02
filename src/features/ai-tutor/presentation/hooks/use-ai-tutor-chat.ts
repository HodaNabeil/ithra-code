'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { MessageSourceDTO } from '../../application/dto/message-source.dto';
import { AI_TUTOR_CONSTANTS } from '../../shared';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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
    messages: ChatMessage[];
  };
};

type StreamMeta = {
  sources: MessageSourceDTO[];
  usedFallback: boolean;
};

function createMessageId(): string {
  return crypto.randomUUID();
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

function parseStreamMeta(payload: string): StreamMeta | null {
  if (!payload.startsWith(AI_TUTOR_CONSTANTS.SSE_META_PREFIX)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      payload.slice(AI_TUTOR_CONSTANTS.SSE_META_PREFIX.length),
    ) as StreamMeta;

    if (!Array.isArray(parsed.sources)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

async function streamTutorResponse(params: {
  question: string;
  options: UseAITutorChatOptions;
  assistantMessageId: string;
  signal: AbortSignal;
  onMeta: (assistantMessageId: string, meta: StreamMeta) => void;
  onToken: (assistantMessageId: string, token: string) => void;
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

    for (const event of events) {
      const line = event.trim();
      if (!line.startsWith('data: ')) {
        continue;
      }

      const payload = line.slice(6);

      if (payload === '[DONE]') {
        params.onComplete();
        continue;
      }

      if (payload.startsWith('[ERROR]')) {
        const errorMessage = payload.replace('[ERROR] ', '').split(':').slice(1).join(':');
        throw new Error(errorMessage || 'حدث خطأ أثناء توليد الرد');
      }

      const meta = parseStreamMeta(payload);
      if (meta) {
        params.onMeta(params.assistantMessageId, meta);
        continue;
      }

      params.onToken(params.assistantMessageId, payload);
    }
  }

  params.onComplete();
}

export function useAITutorChat(options: UseAITutorChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
        setMessages(payload.data.messages);
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

  const appendToken = useCallback((assistantMessageId: string, token: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantMessageId
          ? { ...message, content: message.content + token }
          : message,
      ),
    );
  }, []);

  const applyMeta = useCallback(
    (assistantMessageId: string, meta: StreamMeta) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                sources: meta.sources.length > 0 ? meta.sources : undefined,
              }
            : message,
        ),
      );
    },
    [],
  );

  const runQuestion = useCallback(
    async (question: string, requestOptions: { includeUserMessage: boolean }) => {
      const assistantMessageId = createMessageId();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
      };

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
          onComplete: () => setStreamState('idle'),
        });
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          setStreamState('idle');
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
      }
    },
    [appendToken, applyMeta, options],
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
    setStreamState('idle');
  }, []);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    retry,
    cancel,
    isStreaming,
    isLoadingHistory,
    error,
  };
}
