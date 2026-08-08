# ADR-002: Course-Scoped Conversations with Lecture Threading

## Status
✅ Accepted

## Context

Students need to ask questions about multiple lectures in a course while maintaining conversation context. Key requirements:

- One conversation per course (not globally) to keep context focused
- Multiple topics/lectures within a course (threading)
- Conversation history should inform responses
- Should be easy to navigate and organize

We considered several organizational strategies for managing conversations and threads.

## Decision

Implement **course-scoped conversations with lecture-based threading**:

```
Course (e.g., "React Fundamentals")
├── Conversation (1 per course, per student)
│   ├── Thread 1 (Lecture: "React Basics")
│   │   ├── Message 1: "What is React?"
│   │   ├── Message 2: "How does JSX work?"
│   │   └── Message 3: "..." 
│   ├── Thread 2 (Lecture: "Hooks")
│   │   ├── Message 1: "What is useState?"
│   │   └── Message 2: "..."
│   └── Thread 3 (Lecture: "Performance")
│       └── Message 1: "..."
```

### **Data Model**
```typescript
TutorConversation {
  id: string;
  courseId: string;      // Links to course (one per course per student)
  userId: string;
  threads: TutorThread[];
  createdAt: Date;
  updatedAt: Date;
}

TutorThread {
  id: string;
  conversationId: string;
  lectureId?: string;     // Optional - may be user-created topic
  topic: string;          // Display name
  messages: TutorMessage[];
  createdAt: Date;
  updatedAt: Date;
}

TutorMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  retrievedSources?: KnowledgeChunk[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Benefits

1. **Context Grouping:** Each conversation is focused on one course, not noisy with multiple courses
2. **Organization:** Students can discuss different lectures in separate threads
3. **Easy Navigation:** Clear hierarchy (Course → Thread → Messages)
4. **Flexible Scoping:** Can include cross-lecture questions in a thread if needed
5. **Performance:** Queries naturally partition by course
6. **UI Simplicity:** Straightforward to display in tabs/dropdown

## Implementation

### **Conversation Retrieval**
```typescript
// Get or create conversation for course
const conversation = await ConversationRepository.getOrCreate({
  courseId: 'course-123',
  userId: 'user-456',
});

// Get or create thread for lecture within that conversation
const thread = await conversation.getOrCreateThread({
  lectureId: 'lecture-789',
  topic: 'React Basics',
});

// Add message to thread
const message = await thread.addMessage({
  role: 'user',
  content: 'What is React?',
});
```

### **Message Loading**
```typescript
// Load conversation history for context
const recentMessages = await thread.getMessages({ limit: 20 });

// These messages inform the prompt context
const context = buildContext({
  conversationHistory: recentMessages,
  // ...
});
```

### **Thread Switching**
```typescript
// When student clicks different lecture
const newThread = await conversation.getOrCreateThread({
  lectureId: 'lecture-790',
  topic: 'Hooks',
});

// Load messages from new thread
const newMessages = await newThread.getMessages({ limit: 20 });
// UI updates to show new thread's conversation
```

## Consequences

### **Positive**
- Clear organization that matches course structure
- Easy to implement and understand
- Naturally prevents context bloat (threads stay focused)
- Good UX - students know exactly where their questions are
- Scalable - can add more threads without performance issues

### **Negative**
- Students must explicitly switch threads (can't have continuous multi-lecture conversation)
- May need to manually provide context if asking about multiple lectures
- Thread boundaries could feel restrictive for some use cases

## Related Decisions
- ADR-003: Content classification for educational integrity
- Database schema design for conversation tables

## Alternatives Considered

### **Global Conversation** 
One continuous conversation across entire platform.
- ❌ Context becomes huge and noisy
- ❌ Hard to navigate
- ❌ Poor performance at scale

### **Per-Lecture Conversations**
Separate conversation for each lecture.
- ❌ Students can't reference previous lectures in same thread
- ❌ Creates fragmentation
- ❌ UI clutter with many conversations

### **Topic-Based Threads (User-Created)**
Let students create arbitrary topic threads.
- ⚠️ Could work but adds UX complexity
- ⚠️ Students might create redundant threads
- ⚠️ No automatic organization

## Future Enhancements

1. **Cross-Thread Context**
   - Allow referencing messages from other threads
   - Example: "Remember we discussed [from Thread 1]?"

2. **Merge Threads**
   - Allow students to merge threads if discussion spans multiple lectures

3. **Archive Threads**
   - Archive old threads to reduce clutter
   - Still searchable but not in main view

4. **Automatic Thread Creation**
   - Create threads based on student's lecture viewing
   - Smart thread suggestions based on question content

---

**Date:** 2024
**Author:** Architecture Team
