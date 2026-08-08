import { prisma } from '@/lib/prisma';
import {
  pathDetailSelect,
  type DB_PathDetailEntity,
} from './path-detail.select';

export interface PathDetailRepository {
  findBySlug(slug: string): Promise<DB_PathDetailEntity | null>;
}

export class PrismaPathDetailRepository implements PathDetailRepository {
  async findBySlug(slug: string): Promise<DB_PathDetailEntity | null> {
    return prisma.path.findUnique({
      where: { slug },
      select: pathDetailSelect,
    });
  }
}

export const pathDetailRepository = new PrismaPathDetailRepository();
