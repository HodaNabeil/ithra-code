# ADR-005: Streaming Response Architecture

## Status
✅ Accepted

## Context

AI Tutor responses can take 2-5 seconds to generate. Users shouldn't stare at a blank screen for that duration. Response alternatives:

1. **Buffering** - Wait for full response, then display
   - User sees nothing until complete
   - Poor UX for long responses
   - High perceived latency

2. **Streaming** - Show tokens as they arrive
   - Real-time feedback
   - Better perceived performance
   - User can start reading while AI is still thinking

The team values responsive user experience and fast perceived latency.

## Decision

Implement **token-level streaming** throughout the entire pipeline:

### **Architecture**

```
┌─────────────────────────────────────────────┐
│         Frontend (React Component)          │
│  - Display tokens as they arrive            │
│  - Real-time message composition            │
│  - Smooth animation                         │
└────────────────────┬────────────────────────┘
                     │
                     │ Streaming Response
                     │ (Server-Sent Events)
                     ↓
┌─────────────────────────────────────────────┐
│       API Endpoint (Streaming)              │
│  - Receive token stream from LLM            │
│  - Forward tokens to client                 │
│  - Error handling mid-stream                │
└────────────────────┬────────────────────────┘
                     │
                     │ Token Stream
                     │ (AsyncIterator)
                     ↓
┌─────────────────────────────────────────────┐
│    OpenAI LLM Adapter (Streaming)           │
│  - Fetch tokens from API                    │
│  - Handle stream errors                     │
│  - Provide AsyncIterator interface          │
└─────────────────────────────────────────────┘
```

### **Implementation Details**

#### **Port Definition**
```typescript
// src/features/ai-tutor/domain/ports/LlmPort.ts
export interface LlmPort {
  streamAnswer(params: {
    messages: Message[];
    systemPrompt: string;
  }): AsyncIterableIterator<string>;  // Yields tokens
}
```

#### **Adapter Implementation**
```typescript
// src/features/ai-tutor/infrastructure/adapters/OpenAILlmAdapter.ts
async *streamAnswer(params: {
  messages: Message[];
  systemPrompt: string;
}): AsyncIterableIterator<string> {
  const response = await this.openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'system', content: params.systemPrompt }, ...params.messages],
    stream: true,  // Enable streaming
  });

  // Iterate over streaming chunks
  for await (const chunk of response) {
    if (chunk.choices[0]?.delta?.content) {
      yield chunk.choices[0].delta.content;  // Yield each token
    }
  }
}
```

#### **API Endpoint**
```typescript
// src/features/ai-tutor/api/routes/messages.ts
export async function POST(request: Request) {
  const { question, courseId } = await request.json();

  // Set streaming headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  // Stream tokens
  (async () => {
    try {
      const stream = await askTutorUseCase.execute({
        question,
        courseId,
      });

      for await (const token of stream) {
        await writer.write(new TextEncoder().encode(`data: ${token}\n`));
      }

      await writer.write(new TextEncoder().encode('data: [DONE]\n'));
    } catch (error) {
      await writer.write(
        new TextEncoder().encode(`data: [ERROR] ${error.message}\n`)
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, { headers });
}
```

#### **Frontend Component**
```typescript
// src/features/ai-tutor/presentation/components/AITutorChat.tsx
function useStreamingResponse(question: string) {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ask = async () => {
    setIsLoading(true);
    setResponse('');

    const response = await fetch('/api/tutor/messages', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const token = line.slice(6);
          if (token === '[DONE]') {
            setIsLoading(false);
          } else if (token.startsWith('[ERROR]')) {
            setResponse(prev => prev + '\n\nError: ' + token.slice(7));
            setIsLoading(false);
          } else {
            setResponse(prev => prev + token);
          }
        }
      }
    }
  };

  return { response, isLoading, ask };
}
```

## Benefits

1. **Better UX**
   - User sees response appearing immediately
   - Reduced perceived latency
   - Can start reading while AI is generating

2. **Real-Time Feedback**
   - Students know AI is working (loading animation)
   - Stops spinning wheel confusion
   - Engaging user experience

3. **Performance**
   - No buffering overhead
   - Lower memory usage (process tokens one at a time)
   - Scales better with large responses

4. **Consistency**
   - Streaming from LLM through API to frontend
   - No copying/buffering intermediate states
   - Single source of truth (token stream)

5. **Error Handling**
   - Can catch and handle mid-stream errors
   - Send error messages to user cleanly
   - Save partial response

## Implementation Across Layers

| Layer | Streaming Approach |
|-------|-------------------|
| LLM Adapter | `AsyncIterator<string>` yields tokens |
| Use Case | Chains async iterators |
| API | HTTP streaming (text/event-stream) |
| Frontend | EventSource or fetch ReadableStream |

## Consequences

### **Positive**
- Excellent user experience
- Better perceived performance
- Real-time feedback
- Scalable approach
- Handles errors gracefully

### **Negative**
- Can't batch tokens for optimization
- Loss of token stream requires restart
- Slightly more complex error handling
- Client must support streaming (widely supported now)

## Related Decisions
- ADR-001: Port & Adapter pattern (LlmPort)
- Response validation happens after complete response

## Alternatives Considered

### **Server-Sent Events (SSE)**
```typescript
// Alternative: Use native SSE instead of custom streaming
const eventSource = new EventSource('/api/tutor/messages?question=' + q);
eventSource.onmessage = (event) => {
  setResponse(prev => prev + event.data);
};
```

**Pros:**
- Built-in browser support
- Automatic reconnection

**Cons:**
- GET only (security concern with sensitive data)
- Less flexible than streams

**Decision:** ⚠️ Valid alternative, but fetch+streaming more versatile

### **WebSocket**
```typescript
// Full-duplex communication
const ws = new WebSocket('ws://api.tutor/messages');
ws.onmessage = (event) => setResponse(prev => prev + event.data);
```

**Pros:**
- Full duplex
- Lower latency than HTTP

**Cons:**
- Overkill for one-way streaming
- Adds infrastructure complexity
- Harder to scale

**Decision:** ❌ Rejected - HTTP streaming sufficient

### **Polling**
Client polls `/api/tutor/messages/status?messageId=123` every 200ms

**Pros:**
- Simple to understand
- Works everywhere

**Cons:**
- High latency between polls
- Inefficient - many requests for no new data
- Doesn't feel real-time

**Decision:** ❌ Rejected - poor UX

## Future Enhancements

1. **Token Accumulation**
   - Buffer small number of tokens for optimization
   - Send micro-batches if network latency high

2. **Bidirectional Streaming**
   - WebSocket for more interactive experience
   - Student can interrupt/redirect mid-response

3. **Partial Response Saving**
   - Save partial responses if stream interrupted
   - Resume from checkpoint

4. **Response Caching**
   - Cache streamed responses for common questions
   - Replay cached response when available

---

**Date:** 2024
**Author:** Architecture Team
