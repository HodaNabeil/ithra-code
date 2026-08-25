# Testimonials Feature

## Overview

This feature provides a unified testimonials system that combines:
- Admin-created testimonials
- Platform reviews with rating >= 4

## Usage

### In Server Components (Recommended)

```typescript
import { getTestimonialsAction } from '@/features/testimonials/actions/testimonials.actions';

export default async function MyPage() {
  const result = await getTestimonialsAction({ limit: 6 });
  
  if (!result.success) {
    // Handle error
    return <div>Error loading testimonials</div>;
  }
  
  return <TestimonialSection items={result.items} />;
}
```

### Using the API Directly

```bash
# Get testimonials (public endpoint)
GET /api/testimonials?page=1&limit=10
```

### Admin Operations

```typescript
// Create testimonial (admin only)
POST /api/testimonials
{
  "name": "Ahmed Hassan",
  "content": "Great platform!",
  "rating": 5,
  "avatarUrl": "https://example.com/avatar.jpg",
  "isActive": true
}

// Update testimonial (admin only)
PATCH /api/testimonials/{id}
{
  "rating": 4
}

// Delete testimonial (admin only)
DELETE /api/testimonials/{id}
```

## Data Structure

Each testimonial item includes:

```typescript
{
  id: string;
  source: 'testimonial' | 'review';
  name: string;
  avatarUrl: string | null;
  content: string;
  rating: number;
  createdAt: string; // ISO 8601
}
```

## Features

- ✅ Combines admin testimonials + reviews (rating >= 4)
- ✅ Unified format with `source` field
- ✅ Sorted by createdAt DESC (newest first)
- ✅ Pagination support
- ✅ Admin CRUD operations
- ✅ Type-safe with TypeScript
- ✅ Zod validation
