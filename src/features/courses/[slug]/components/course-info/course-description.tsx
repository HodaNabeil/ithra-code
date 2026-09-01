import { FormattedTextContent } from '@/components/shared/expandable-content';
import { Course } from '@/types/course/course.types';

interface CourseDescriptionProps {
  description: Course['description'];
}

export function CourseDescription({ description }: CourseDescriptionProps) {
  return (
    <div className="space-y-4 p-6 border border-primary/20 rounded-xl font-sans mb-8">
      <h3 className="font-bold text-foreground text-xl md:text-2xl text-right">
        الوصف
      </h3>

      <FormattedTextContent content={description} className="text-sm" />
    </div>
  );
}
