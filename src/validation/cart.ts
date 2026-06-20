import { z } from '@/lib/zod-openapi';

export const courseIdSchema = z.string().cuid('معرّف الدورة غير صالح').openapi({
  example: 'clg2v3z5f000008l5d6e3k1n',
  description: 'Course UUID (CUID from seeded data)',
});

export const courseIdsSchema = z
  .array(courseIdSchema)
  .min(1, 'يجب توفير دورة واحدة على الأقل')
  .max(50, 'لا يمكن مزامنة أكثر من 50 دورة');
