# AI Tutor Implementation Roadmap

## Overview

Sprint-by-sprint implementation plan for the IthraCode AI Tutor feature. Each sprint delivers a working, testable increment following a vertical slice strategy.

---

## Sprint 1: Foundation & Basic Chat

### **Task 1.1: Core Architecture Setup**
**Responsibility:** Foundation layer with dependency structure

**Tasks:**
- Create `src/features/ai-tutor/` directory with clean architecture layers
- Define application ports: `LlmPort`, `EmbeddingPort`, `VectorSearchPort`, `ConversationRepositoryPort`, `ContentFilterPort`
- Add environment variables with feature flag (`AI_TUTOR_ENABLED`)
- Create basic domain models: `TutorMessage`, `TutorConversation`

**Acceptance Criteria:**
- ✅ Project structure follows clean architecture (domain, application, infrastructure, api, presentation)
- ✅ Port interfaces are defined and documented
- ✅ Environment variables are validated through existing env configuration
- ✅ Domain models compile without errors

**Testing:**
- Unit: Test environment validation and feature flag parsing
- Integration: Verify feature flag controls component registration

**Demo:**
- Project compiles with AI tutor feature structure in place
- Port interfaces are clearly defined and ready for implementation

---

### **Task 1.2: OpenAI LLM Adapter**
**Responsibility:** First working LLM integration

**Tasks:**
- Implement `OpenAILlmAdapter` implementing `LlmPort` with streaming support
- Create `AskTutorUseCase` with basic prompt handling
- Add simple conversation management (in-memory for now)
- Wire adapter through dependency injection

**Acceptance Criteria:**
- ✅ Adapter sends requests to OpenAI API with proper error handling
- ✅ Response streaming works with proper chunk handling
- ✅ Use case coordinates adapter and returns streamed responses
- ✅ Basic conversation context is maintained

**Testing:**
- Unit: Test adapter with mocked OpenAI responses
- Integration: Test end-to-end question → response flow
- Error handling: Test timeouts, rate limits, API errors

**Demo:**
- Basic AI chat functionality works end-to-end
- Students can ask questions and see streamed responses (without course context)

---

### **Task 1.3: Dependency Injection Setup**
**Responsibility:** Service registration and configuration

**Tasks:**
- Register AI services in the DI container
- Configure port-to-adapter mappings for LLM services
- Add conditional service registration based on feature flags
- Create AI tutor configuration class

**Acceptance Criteria:**
- ✅ All AI services resolve correctly from DI container
- ✅ Feature flag controls whether AI services are registered
- ✅ Configuration follows existing project patterns
- ✅ Services are properly scoped (singleton vs transient)

**Testing:**
- Unit: Test service registration with different configurations
- Integration: Test service resolution under various feature flag states

**Demo:**
- Clean dependency injection for AI components
- Services resolve correctly in all scenarios

---

### **Task 1.4: Basic UI Integration**
**Responsibility:** User-facing AI interface

**Tasks:**
- Replace Q&A tab placeholder with `AITutorChat` component
- Implement message streaming UI with loading states
- Add basic error handling and user feedback
- Add retry logic for failed requests

**Acceptance Criteria:**
- ✅ Chat component renders correctly in lecture interface
- ✅ Messages stream in real-time without freezing UI
- ✅ Loading states clearly indicate AI is processing
- ✅ Errors are displayed to user with retry options
- ✅ Component is accessible and responsive

**Testing:**
- Unit: Test component rendering and state management
- Integration: Test message streaming and error scenarios
- E2E: Test user interactions in real browser

**Demo:**
- Working AI tutor interface in lecture page
- Students can interact with AI in real time

---

## Sprint 2: Conversation Persistence

### **Task 2.1: Conversation Database Schema**
**Responsibility:** Database persistence for conversations

**Tasks:**
- Create Prisma models: `TutorConversation`, `TutorMessage`
- Implement `ConversationRepository` adapter for `ConversationRepositoryPort`
- Support course-scoped conversations (one per course)
- Create migration and run seed data

**Acceptance Criteria:**
- ✅ Prisma migration runs successfully
- ✅ Conversations persist across browser sessions
- ✅ Each course has exactly one conversation
- ✅ Message queries are performant with proper indexes
- ✅ Relationships are properly enforced

**Testing:**
- Integration: Test CRUD operations on conversations and messages
- Database: Test migrations run cleanly on fresh database
- Performance: Test query performance with large message sets

**Demo:**
- Conversation history persists and loads correctly
- Users see previous messages when returning to course

---

### **Task 2.2: Conversation Threading**
**Responsibility:** Organize conversations by lecture/topic

**Tasks:**
- Extend schema with `TutorThread` model for lecture/topic organization
- Update UI to show conversation threads with context
- Add thread creation and navigation logic
- Implement thread-specific message retrieval

**Acceptance Criteria:**
- ✅ Multiple threads can exist within one course conversation
- ✅ Threads are automatically created per lecture
- ✅ User can navigate between threads smoothly
- ✅ Thread context (lecture name, topic) is displayed
- ✅ Messages stay within their respective threads

**Testing:**
- Unit: Test thread creation and context logic
- Integration: Test thread navigation and persistence
- UI: Test thread switching and message display

**Demo:**
- Organized conversation interface with lecture/topic threading
- Users can manage multiple discussion threads per course

---

## Sprint 3: Course Context Integration

### **Task 3.1: Basic Course Context Builder**
**Responsibility:** Gather course and student information

**Tasks:**
- Implement `CourseContextService` to gather course and lecture info
- Create `TutorSessionContext` domain model
- Add student enrollment and progress data to context
- Create queries for course, section, and lecture data

**Acceptance Criteria:**
- ✅ Context includes current course, section, and lecture details
- ✅ Student enrollment status and progress are included
- ✅ Context is efficiently cached to avoid N+1 queries
- ✅ Context gracefully handles missing data

**Testing:**
- Unit: Test context building with various data states
- Integration: Test queries against real database
- Performance: Verify no N+1 queries

**Demo:**
- AI responses reference specific course and lecture context
- Context is visible in debugging and logs

---

### **Task 3.2: Dynamic Prompt Engineering**
**Responsibility:** Build contextual prompts for LLM

**Tasks:**
- Create `PromptBuilder` service combining system prompts with course context
- Add conversation history integration to prompts
- Implement basic educational guidelines (guide vs. tell)
- Test various prompt variations

**Acceptance Criteria:**
- ✅ Prompts include course title, lecture name, and key objectives
- ✅ Conversation history is formatted correctly in prompts
- ✅ Educational guidelines are enforced in system prompt
- ✅ Prompts stay within token limits
- ✅ Prompt structure is easy to test and modify

**Testing:**
- Prompt: Validate prompts include expected context elements
- Prompt: Test educational guideline enforcement
- Unit: Test prompt builder with various inputs

**Demo:**
- AI responses are course-specific and contextually aware
- Prompts are visible in logs for debugging

---

## Sprint 4: Content Indexing Pipeline

### **Task 4.1: Basic Content Models**
**Responsibility:** Define and extract course content

**Tasks:**
- Create `KnowledgeChunk`, `LectureTranscript` models
- Implement content extraction for lectures and descriptions
- Add basic chunking strategy for text content
- Create content type classification

**Acceptance Criteria:**
- ✅ Course content can be extracted without errors
- ✅ Chunks are appropriately sized for embedding
- ✅ Content metadata (source, type, lecture) is preserved
- ✅ Content extraction handles various formats gracefully

**Testing:**
- Unit: Test content extraction with sample materials
- Integration: Test end-to-end extraction and storage

**Demo:**
- Content processing pipeline for text materials
- Extracted content visible in database

---

### **Task 4.2: Embedding Generation**
**Responsibility:** Generate and store vector embeddings

**Tasks:**
- Implement `OpenAIEmbeddingAdapter` for `EmbeddingPort`
- Create embedding generation and storage pipeline
- Add batch processing for efficient indexing
- Register embedding services in DI container

**Acceptance Criteria:**
- ✅ Content chunks generate embeddings successfully
- ✅ Embeddings are stored with proper metadata
- ✅ Batch processing handles large content sets
- ✅ Failed embeddings are retried with exponential backoff
- ✅ API rate limits are respected

**Testing:**
- Integration: Test embedding generation and storage
- Performance: Test batch processing with various sizes
- Error handling: Test retry logic and rate limit handling

**Demo:**
- Course content is embedded and stored
- Embeddings are queryable and properly indexed

---

## Sprint 5: Vector Search & Basic RAG

### **Task 5.1: Vector Similarity Search**
**Responsibility:** Retrieve relevant content by similarity

**Tasks:**
- Implement vector similarity search adapter for `VectorSearchPort`
- Create `ContentRetriever` service for finding relevant chunks
- Add relevance scoring and ranking logic
- Implement top-k retrieval

**Acceptance Criteria:**
- ✅ Vector search returns most relevant chunks first
- ✅ Search performance is acceptable (<200ms)
- ✅ Relevance scores are meaningful and comparable
- ✅ Edge cases (empty query, no results) handled gracefully

**Testing:**
- RAG: Test retrieval precision with known questions and expected results
- Performance: Benchmark search latency with various query sizes
- Edge cases: Test with empty queries, single words, long texts

**Demo:**
- Content retrieval works for student questions
- Retrieved chunks are relevant and properly ranked

---

### **Task 5.2: RAG Pipeline Integration**
**Responsibility:** Combine retrieval with LLM for grounded responses

**Tasks:**
- Integrate retriever into `AskTutorUseCase`
- Combine retrieved content with conversation context in prompts
- Add fallback handling when no relevant content found
- Implement source citation in responses

**Acceptance Criteria:**
- ✅ AI responses reference retrieved course content
- ✅ Fallback responses trigger when retrieval is empty
- ✅ Retrieved sources are visible for transparency
- ✅ RAG pipeline maintains streaming functionality

**Testing:**
- RAG: Test groundedness - responses reference retrieved content
- RAG: Test hallucination detection - no unsupported claims
- Integration: Test full pipeline end-to-end

**Demo:**
- AI provides answers grounded in course content
- Retrieved sources are cited or referenced in responses

---

## Sprint 6: Enhanced Content Processing

### **Task 6.1: Multi-format Content Support**
**Responsibility:** Handle diverse content types

**Tasks:**
- Extend content extraction to PDFs, attachments, and video transcripts
- Improve chunking strategies for different content types
- Add content metadata preservation (source, type, section, lecture)
- Handle edge cases (corrupted files, unsupported formats)

**Acceptance Criteria:**
- ✅ PDF content is extracted and chunked
- ✅ Attachments are processed according to type
- ✅ Video transcripts are properly chunked
- ✅ Content metadata is preserved through pipeline
- ✅ Unsupported formats are gracefully skipped

**Testing:**
- Integration: Test extraction for each supported content type
- Edge cases: Test with corrupted, empty, and malformed files
- Performance: Test batch processing with mixed content types

**Demo:**
- Comprehensive knowledge base covers all course content formats
- All material types are searchable and retrievable

---

### **Task 6.2: Assessment Content Classification**
**Responsibility:** Identify and protect assessment materials

**Tasks:**
- Implement `ContentClassificationService` for identifying assessments
- Add content filtering to distinguish learning vs. assessment materials
- Create assessment reference system (hints without answers)
- Mark sensitive content appropriately

**Acceptance Criteria:**
- ✅ Quiz and assignment content is identified
- ✅ Assessment content is tagged appropriately
- ✅ Assessment references can be used without revealing answers
- ✅ Classification accuracy is high (>95%)

**Testing:**
- Unit: Test classification logic with known content types
- Integration: Test classification on real course data
- Accuracy: Validate classification against manual review

**Demo:**
- Assessment content is properly identified and classified
- AI can reference learning objectives without revealing solutions

---

## Sprint 7: Educational Integrity & Content Filtering

### **Task 7.1: Educational Response Filtering**
**Responsibility:** Prevent assessment answer leakage

**Tasks:**
- Implement response validation to prevent direct assessment answers
- Add guided learning prompts that encourage discovery
- Create fallback suggestions for assessment-related questions
- Implement educational boundary checks

**Acceptance Criteria:**
- ✅ Direct quiz answers are never provided
- ✅ Direct assignment solutions are never provided
- ✅ Guided learning approach is used instead
- ✅ Fallback responses are helpful and appropriate
- ✅ False positives are minimal

**Testing:**
- Unit: Test response filtering rules
- Integration: Test with real quiz/assignment content
- Adversarial: Try to trick AI into revealing answers
- Educational: Verify guided approach is pedagogically sound

**Demo:**
- Educational boundaries are maintained
- AI provides guidance without compromising learning process

---

### **Task 7.2: Intelligent Content Suggestions**
**Responsibility:** Guide students to relevant materials

**Tasks:**
- Enhance fallback system to suggest relevant lectures and materials
- Add cross-reference suggestions when content isn't available
- Implement smart content navigation recommendations
- Create suggestion ranking algorithm

**Acceptance Criteria:**
- ✅ Suggestions are relevant to student questions
- ✅ Suggestions help students find information themselves
- ✅ Suggestions improve over time with usage
- ✅ Suggestions are formatted clearly for navigation

**Testing:**
- Unit: Test suggestion ranking algorithms
- Integration: Test suggestions with various content gaps
- UX: Test that suggestions are helpful to students

**Demo:**
- AI guides students to relevant learning materials
- Students find answers through guided discovery

---

## Sprint 8: Basic Learning Analytics

### **Task 8.1: Student Progress Integration**
**Responsibility:** Include student performance in context

**Tasks:**
- Extend course context to include detailed progress and performance data
- Add quiz performance analysis (without revealing answers)
- Implement basic knowledge gap detection
- Create progress visualization helpers

**Acceptance Criteria:**
- ✅ Context includes completion status for all lectures
- ✅ Quiz performance is analyzed without revealing answers
- ✅ Knowledge gaps are identified from performance data
- ✅ Progress data is efficiently queried and cached

**Testing:**
- Unit: Test gap detection algorithms
- Integration: Test with real student progress data
- Performance: Verify progress queries don't impact response time

**Demo:**
- AI responses consider student's learning progress
- Personalization is based on actual performance data

---

### **Task 8.2: Simple Learning Pattern Recognition**
**Responsibility:** Adapt to individual learning styles

**Tasks:**
- Create basic `StudentLearningProfile` model
- Track explanation preferences (concise vs. detailed, code vs. theory)
- Add adaptive response formatting based on interaction history
- Implement preference learning from conversation patterns

**Acceptance Criteria:**
- ✅ Learning preferences are tracked accurately
- ✅ Responses adapt to tracked preferences
- ✅ Preferences improve with more interactions
- ✅ Preferences are persisted per student

**Testing:**
- Unit: Test preference tracking logic
- Integration: Test adaptive responses with different profiles
- UX: Validate that personalization improves user experience

**Demo:**
- Personalized response formatting improves over time
- AI learns and adapts to individual student needs

---

## Sprint 9: Production Readiness

### **Task 9.1: API Robustness**
**Responsibility:** Production-grade API endpoints

**Tasks:**
- Add comprehensive error handling, rate limiting, and validation
- Implement proper authentication and authorization
- Add API monitoring and structured logging
- Create error response standards and documentation

**Acceptance Criteria:**
- ✅ All inputs are validated with clear error messages
- ✅ Rate limiting protects against abuse
- ✅ Authentication/authorization is enforced
- ✅ Errors are properly logged for debugging
- ✅ API documentation is complete and accurate

**Testing:**
- Unit: Test validation and error handling
- Integration: Test API endpoints with various inputs
- Security: Test authentication, authorization, and rate limits
- Load: Test behavior under high concurrent load

**Demo:**
- Production-ready API with proper security and monitoring
- Clear error messages and comprehensive logging

---

### **Task 9.2: Performance & Monitoring**
**Responsibility:** Observable and performant system

**Tasks:**
- Add caching for embeddings and frequent queries
- Implement metrics for response time, accuracy, and usage
- Create basic evaluation framework for response quality
- Add performance dashboards and alerts

**Acceptance Criteria:**
- ✅ Response latency meets SLA (<2s for most queries)
- ✅ Embeddings are cached effectively
- ✅ Metrics are collected and queryable
- ✅ Dashboards display key performance indicators
- ✅ Alerts trigger on performance degradation

**Testing:**
- Performance: Measure and verify latency benchmarks
- Monitoring: Test metric collection and dashboard display
- Load: Test system behavior under realistic usage

**Demo:**
- Optimized performance with monitoring dashboard
- System is observable and maintainable

---

### **Task 9.3: AI Evaluation Dataset**
**Responsibility:** Automated quality assurance for AI responses

**Tasks:**
- Create representative evaluation dataset with diverse question types
- Include expected sources and reference answers
- Implement automated evaluation metrics:
  - **Retrieval Precision:** % of relevant chunks in top-k results
  - **Groundedness:** Response supported by retrieved content
  - **Hallucination Rate:** Detect unsupported information
  - **Response Quality:** Helpfulness and clarity scores
  - **Educational Integrity:** Assessment answer leakage detection
- Build regression testing pipeline
- Create evaluation reporting dashboard

**Acceptance Criteria:**
- ✅ Evaluation dataset covers diverse question types (5+ categories)
- ✅ Metrics accurately measure AI performance
- ✅ Regression tests run automatically after AI changes
- ✅ Evaluation reports are clear and actionable
- ✅ Baseline metrics are established for all areas
- ✅ Metric improvements/regressions trigger notifications

**Testing:**
- Unit: Test individual evaluation metrics
- Integration: Test full evaluation pipeline
- Accuracy: Validate metrics match manual review
- Automation: Test regression pipeline triggers

**Demo:**
- Automated AI quality assurance system
- Regression testing prevents performance degradation
- Performance tracking dashboard shows trends

---

## Vertical Slice Strategy

Each sprint delivers a complete, working feature:

```
Sprint 1: Basic conversational AI (no context yet)
    ↓
Sprint 2: Persistent conversations with threading
    ↓
Sprint 3: Course-aware AI responses
    ↓
Sprint 4-5: Knowledge base with RAG (grounded responses)
    ↓
Sprint 6-7: Enhanced content + educational safeguards
    ↓
Sprint 8: Learning-aware personalization
    ↓
Sprint 9: Production-ready system with monitoring
```

---

## Key Metrics

- **Delivery:** One working feature per sprint
- **Quality:** All acceptance criteria met, comprehensive tests pass
- **Performance:** Streaming responses, <200ms retrieval, <2s total latency
- **Reliability:** Graceful error handling, proper fallbacks
- **Education:** Educational integrity maintained, no assessment leakage

---

Last Updated: 2024
