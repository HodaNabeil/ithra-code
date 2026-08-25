import { prisma } from '@/lib/prisma';

/**
 * Raw testimonial from database (admin-created).
 */
export type RawTestimonial = {
  id: string;
  name: string;
  avatarUrl: string | null;
  content: string;
  rating: number;
  createdAt: Date;
};

/**
 * Raw review from database (platform review with rating >= 4).
 */
export type RawReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  };
};

/**
 * Repository for fetching active testimonials.
 */
export async function findActiveTestimonials(): Promise<RawTestimonial[]> {
  return prisma.testimonial.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      content: true,
      rating: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Repository for fetching reviews with rating >= 4.
 */
export async function findQualifyingReviews(): Promise<RawReview[]> {
  return prisma.review.findMany({
    where: {
      rating: {
        gte: 4,
      },
      comment: {
        not: null,
      },
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Repository for finding a testimonial by ID.
 */
export async function findTestimonialById(
  id: string,
): Promise<RawTestimonial | null> {
  return prisma.testimonial.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      content: true,
      rating: true,
      createdAt: true,
    },
  });
}

/**
 * Repository for creating a new testimonial.
 */
export async function createTestimonial(data: {
  name: string;
  avatarUrl?: string | null;
  content: string;
  rating: number;
  isActive?: boolean;
}): Promise<RawTestimonial> {
  return prisma.testimonial.create({
    data: {
      name: data.name,
      avatarUrl: data.avatarUrl ?? null,
      content: data.content,
      rating: data.rating,
      isActive: data.isActive ?? true,
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      content: true,
      rating: true,
      createdAt: true,
    },
  });
}

/**
 * Repository for updating an existing testimonial.
 */
export async function updateTestimonial(
  id: string,
  data: {
    name?: string;
    avatarUrl?: string | null;
    content?: string;
    rating?: number;
    isActive?: boolean;
  },
): Promise<RawTestimonial> {
  return prisma.testimonial.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      content: true,
      rating: true,
      createdAt: true,
    },
  });
}

/**
 * Repository for deleting a testimonial (hard delete).
 */
export async function deleteTestimonial(id: string): Promise<void> {
  await prisma.testimonial.delete({
    where: { id },
  });
}
