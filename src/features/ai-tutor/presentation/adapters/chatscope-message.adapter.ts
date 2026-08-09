import type { MessageModel } from '@chatscope/chat-ui-kit-react';

import type { ChatMessage } from '../hooks/use-ai-tutor-chat';

export function toChatscopeMessageModel(message: ChatMessage): MessageModel {
  return {
    direction: message.role === 'user' ? 'outgoing' : 'incoming',
    position: 'single',
    type: 'custom',
  };
}

export function shouldRenderMessage(
  message: ChatMessage,
  streamingMessageId: string | null,
): boolean {
  const isStreamingThis = message.id === streamingMessageId;

  if (
    message.role === 'assistant' &&
    !message.content.trim() &&
    !isStreamingThis
  ) {
    return false;
  }

  return true;
}
