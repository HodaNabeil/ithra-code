import { z } from 'zod';

export const courseIdSchema = z.string().cuid('معرّف الدورة غير صالح');

export const courseIdsSchema = z
  .array(courseIdSchema)
  .min(1, 'يجب توفير دورة واحدة على الأقل')
  .max(50, 'لا يمكن مزامنة أكثر من 50 دورة');
