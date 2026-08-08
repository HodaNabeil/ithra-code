import Link from 'next/link';
import Image from 'next/image';
import { Star, Users, Clock, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { formatPrice } from '@/lib/formatters';
import { formatCourseLevel } from '@/features/courses/lib/course-formatters';
import type { Course } from '@/types/course/course.types';

interface CoursePrerequisitesProps {
  prerequisites: Course['prerequisites'];
}

export function CoursePrerequisites({
  prerequisites,
}: CoursePrerequisitesProps) {
  if (!prerequisites || prerequisites.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl md:text-2xl font-bold">
          المتطلبات السابقة المقترحة
        </h2>
        <p className="text-muted-foreground text-xs md:text-sm">
          دورات نوصي بها قبل البدء في هذه الدورة
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prerequisites.map((item) => (
          <Link key={item.id} href={`${PUBLIC_ROUTES.COURSES}/${item.slug}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-primary/10 hover:border-primary/30 group bg-card/50 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row h-full">
                <div className="relative w-full sm:w-40 aspect-video sm:aspect-square overflow-hidden shrink-0">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                    <span className="text-white text-[10px] font-medium flex items-center gap-1">
                      عرض الدورة <ArrowLeft className="size-3" />
                    </span>
                  </div>
                </div>

                <CardContent className="p-4 flex flex-col justify-between flex-1 min-w-0">
                  <div className="space-y-2">
                    <h3 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 font-normal px-2"
                      >
                        {formatCourseLevel(item.level)}
                      </Badge>
                      {item.rating > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 font-normal px-2 gap-1 bg-yellow-500/5 text-yellow-600 border-yellow-500/20"
                        >
                          <Star className="size-2.5 fill-yellow-500 text-yellow-500" />
                          {item.rating}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {item.studentCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />
                          {item.studentCount}
                        </span>
                      )}
                      {item.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {Math.round(item.duration / 60)} ساعة
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-primary text-sm">
                      {formatPrice(item.price, item.currency)}
                    </span>
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
