'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getPaths, createCourse } from '@/features/admin/actions/course';
import { createCourseSchema } from '@/validation/course';

// Shadcn UI Components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewCoursePage() {
  const router = useRouter();
  const [paths, setPaths] = useState<{ id: string; title: string }[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState(true);

  const form = useForm<z.infer<typeof createCourseSchema>>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { slug: '', pathId: '' },
  });

  const { isSubmitting, isValid } = form.formState;

  useEffect(() => {
    async function loadPaths() {
      try {
        const data = await getPaths();
        setPaths(data || []);
      } catch (_error) {
        toast.error('فشل في تحميل المسارات');
      } finally {
        setIsLoadingPaths(false);
      }
    }
    loadPaths();
  }, []);

  const onSubmit = async (values: z.infer<typeof createCourseSchema>) => {
    try {
      const course = await createCourse(values.slug, values.pathId);
      toast.success('تم إنشاء الكورس بنجاح');
      router.push(`/admin/courses/${course.slug}/manage/goals`);
    } catch (_error) {
      toast.error('حدث خطأ ما، حاول مرة أخرى');
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-6 text-foreground">
      <div className="w-full max-w-2xl bg-zinc-950/50 backdrop-blur-xl p-8 rounded-2xl border border-zinc-800 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="space-y-2 mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl text-right">
            إضافة كورس جديد
          </h1>
          <p className="text-zinc-400 text-lg text-right">
            أهلاً بكِ مجدداً! صممي بصمتك التعليمية التالية باختيار المسار
            والعنوان المناسبين.
          </p>
        </div>

        <Form {...form}>
          📚 نظام مذاكرة يناسب طاقتك
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            dir="rtl"
            className="space-y-8"
          >
            <div className="grid gap-6">
              {/* Path Selection */}
              <FormField
                control={form.control}
                name="pathId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-200 font-semibold text-base mb-2 block text-right">
                      اختر المسار
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl className="text-right">
                        <SelectTrigger className="bg-zinc-900/50 border-zinc-700 text-white h-12 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all rounded-xl flex-row-reverse">
                          <SelectValue
                            placeholder={
                              isLoadingPaths
                                ? 'جاري تحميل المسارات...'
                                : 'اختر المسار التعليمي'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                        {paths.map((path) => (
                          <SelectItem
                            key={path.id}
                            value={path.id}
                            className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer text-right flex-row-reverse"
                          >
                            {path.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-zinc-500 text-right">
                      هذا المسار سيحدد التصنيف الأساسي للكورس.
                    </FormDescription>
                    <FormMessage className="text-red-400 text-right" />
                  </FormItem>
                )}
              />

              {/* Course Slug/Title */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-200 font-semibold text-base mb-2 block text-right">
                      اسم الكورس
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثل: الإحتراف في Next.js 15"
                        {...field}
                        disabled={isSubmitting}
                        className="bg-zinc-900/50 border-zinc-700 text-white h-12 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all rounded-xl placeholder:text-zinc-600 text-right"
                      />
                    </FormControl>
                    <FormDescription className="text-zinc-500 text-right">
                      سيتم استخدامه لإنشاء رابط الكورس (Slug).
                    </FormDescription>
                    <FormMessage className="text-red-400 text-right" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-x-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-11 px-6 rounded-xl transition-all"
              >
                رجوع
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting || isLoadingPaths}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-11 px-8 rounded-xl shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:shadow-[0_0_25px_rgba(8,145,178,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الكورس'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
