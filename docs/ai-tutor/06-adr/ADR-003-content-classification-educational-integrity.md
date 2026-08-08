# ADR-003: Content Classification for Educational Integrity

## Status
✅ Accepted

## Context

The AI Tutor must protect educational integrity while maximizing learning support. Key tension:

- Students need help understanding concepts
- Students should NOT get direct quiz answers or assignment solutions
- Guidance mode (hints, suggestions) should replace direct answers
- Assessment content should be identified and handled specially

Without a content classification system, the AI could inadvertently:
- Reveal quiz correct answers
- Provide assignment solutions
- Undermine learning through spoon-feeding

## Decision

Implement **multi-stage content classification and filtering**:

### **Stage 1: Indexing Time**
Classify all course content during knowledge base building:

```
Content Type Classification
├── Learning Material (75%+)
│   ├── Lectures
│   ├── Transcripts
│   ├── Textbooks/Notes
│   └── Code Examples
├── Assessment Content (20%+)
│   ├── Quiz Questions (not answers)
│   ├── Assignment Descriptions (not solutions)
│   └── Learning Objectives
└── Instructor-Only (5%-)
    ├── Answer Keys
    └── Solution Guides
```

**Action:** Tag all chunks with sensitivity level:
- `public` - Safe to include in responses
- `assessment` - Include carefully, never reveal answers
- `instructor` - Exclude from student-facing AI

### **Stage 2: Retrieval Time**
Filter retrieved content before RAG construction:

```typescript
const retrieved = await retriever.search(question);
const filtered = retrieved.filter(chunk => {
  if (chunk.sensitivity === 'instructor') return false;
  if (chunk.sensitivity === 'assessment' && isAssessmentQuestion(question)) {
    return transformToHint(chunk);  // Convert to guidance
  }
  return true;
});
```

### **Stage 3: Response Time**
Validate response for assessment content leakage:

```typescript
const validation = await responseValidator.validate({
  response,
  retrievedContent: filtered,
  context,
});

if (validation.revealsAssessments) {
  return fallbackResponse('I notice you asked about a quiz question...');
}
```

### **Data Model**

```typescript
// Chunk Classification
KnowledgeChunk {
  id: string;
  content: string;
  contentType: 'lecture' | 'transcript' | 'attachment' | 'quiz' | 'assignment';
  sensitivity: 'public' | 'assessment' | 'instructor';
  assessmentReference?: {
    assessmentId: string;
    assessmentType: 'quiz' | 'assignment';
    canBeUsedAsHint: boolean;  // e.g., learning objectives can be hints
    isAnswer: boolean;
  };
}
```

## Benefits

1. **Educational Integrity:** Assessment content is protected by design
2. **Flexibility:** Different content types get appropriate handling
3. **Transparency:** Clear rules about what can/can't be shared
4. **Scalability:** Classification happens at indexing time, minimal runtime overhead
5. **Future-Proof:** Can easily extend classification scheme

## Implementation

### **Classifier Service**
```typescript
class ContentClassificationService {
  async classify(content: {
    text: string;
    source: 'lecture' | 'attachment' | 'generated';
    metadata: Record<string, any>;
  }): Promise<ClassifiedContent> {
    // 1. Detect content type (quiz, assignment, etc.)
    const type = this.detectType(content.text);
    
    // 2. Determine sensitivity
    const sensitivity = this.determineSensitivity(type, content);
    
    // 3. Extract metadata (learning objectives, etc.)
    const metadata = this.extractMetadata(content.text, type);
    
    return { type, sensitivity, metadata };
  }

  private detectType(text: string): ContentType {
    if (text.includes('Quiz') || text.includes('Question')) return 'quiz';
    if (text.includes('Assignment') || text.includes('Project')) return 'assignment';
    // ... more patterns
    return 'lecture';
  }

  private determineSensitivity(type: ContentType, content: any): Sensitivity {
    switch (type) {
      case 'quiz':
      case 'assignment':
        return 'assessment';
      case 'solution':
      case 'answer_key':
        return 'instructor';
      default:
        return 'public';
    }
  }
}
```

### **Content Transformation**
```typescript
class GuidanceTransformer {
  // Transform assessment content into guidance hints
  transformToGuidance(chunk: KnowledgeChunk): string {
    if (chunk.assessmentReference?.isAnswer) {
      // Answer: "The correct answer is react hooks"
      // Guidance: "Think about React's mechanism for managing state"
      return this.generateHint(chunk);
    }
    return chunk.content;
  }

  private generateHint(chunk: KnowledgeChunk): string {
    // Use LLM to convert answer to hint
    return await llm.generateHint({
      answer: chunk.content,
      type: chunk.assessmentReference.assessmentType,
    });
  }
}
```

### **Response Validation**
```typescript
class EducationalResponseValidator {
  async validate(response: string, context: ValidationContext): Promise<ValidationResult> {
    // 1. Check for direct answer patterns
    if (this.containsDirectAnswer(response)) {
      return { valid: false, reason: 'reveals_assessment' };
    }

    // 2. Check for solution code patterns
    if (this.containsSolutionCode(response)) {
      return { valid: false, reason: 'reveals_solution' };
    }

    // 3. Check for complete quiz answers
    if (this.completeQuizAnswer(response, context)) {
      return { valid: false, reason: 'reveals_quiz_answer' };
    }

    return { valid: true };
  }
}
```

## Consequences

### **Positive**
- Proactive protection of assessment content
- Systematically distinguishes content types
- Guidance mode maintains educational value
- Can track and prevent integrity violations
- Flexible and extensible

### **Negative**
- Adds classification step at indexing time (slight overhead)
- Requires manual review of classification accuracy
- Some edge cases hard to classify automatically

## Related Decisions
- ADR-001: Port & Adapter pattern (ContentFilterPort)
- ADR-005: Streaming response architecture

## Alternatives Considered

### **No Classification** 
Trust AI to not reveal answers.
- ❌ Risky, no guarantees
- ❌ Can't audit compliance
- ❌ AI can hallucinate wrong answers anyway

### **Block All Assessment Content**
Don't index assessment materials at all.
- ❌ Students can't get guidance on quiz topics
- ❌ Misses opportunity for learning support
- ❌ Assessment content can be useful for learning

### **Manual Review per Query**
Have humans review each response.
- ⚠️ Doesn't scale
- ⚠️ Introduces latency
- ⚠️ Expensive

## Future Enhancements

1. **Concept-Level Classification**
   - Link content to learning concepts
   - Better hint generation based on concept mastery

2. **Machine Learning Classifier**
   - Train model to detect assessment content
   - Improve accuracy over time with feedback

3. **Semantic Analysis**
   - Use embeddings to detect similar-to-answer responses
   - Prevent paraphrased answers

4. **Audit Trail**
   - Log all assessment content interactions
   - Detect students trying to game the system

---

**Date:** 2024
**Author:** Architecture Team
