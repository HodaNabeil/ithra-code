import { Star } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ErrorRetry } from '@/components/shared';
import SectionHeading from './section-heading';
import { TestimonialQuoteIcon } from './testimonial-quote-icon';

const MAX_RATING = 5;

interface Testimonial {
  id: string;
  name: string;
  role?: string;
  content: string;
  avatar?: string;
  avatarUrl?: string | null;
  rating?: number;
  source?: 'testimonial' | 'review';
}

interface TestimonialSectionProps {
  items: Testimonial[];
  hasError?: boolean;
  errorMessage?: string;
}

export default function TestimonialSection({
  items,
  hasError,
  errorMessage,
}: TestimonialSectionProps) {
  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container element-center flex-col">
        <SectionHeading
          subTitle="التوصيات"
          title="ما يقوله طلابي"
        ></SectionHeading>

        {hasError ? (
          <div className="mt-12 w-full">
            <ErrorRetry message={errorMessage} />
          </div>
        ) : items.length === 0 ? (
          <p className="mt-12 text-lg text-muted-foreground text-center">
            لا توجد آراء حالياً
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 w-full">
            {items.map((testimonial) => {
              const avatarSrc = testimonial.avatarUrl || testimonial.avatar;
              const rating = Math.min(
                MAX_RATING,
                Math.max(0, testimonial.rating ?? 0),
              );

              return (
                <Card key={testimonial.id} className="testimonial-card h-full">
                  <CardHeader className="flex items-start justify-start">
                    <TestimonialQuoteIcon
                      gradientId={`testimonial-quote-${testimonial.id}`}
                      className="size-9"
                    />
                  </CardHeader>

                  <CardContent className="flex-1">
                    <blockquote className="leading-relaxed text-muted-foreground">
                      {testimonial.content}
                    </blockquote>
                  </CardContent>

                  <CardFooter className="gap-3 px-4 pb-4">
                    <Avatar className="size-11">
                      {avatarSrc ? (
                        <AvatarImage src={avatarSrc} alt={testimonial.name} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 text-right">
                      <CardTitle className="truncate font-semibold">
                        {testimonial.name}
                      </CardTitle>
                      <div
                        className="mt-1 flex justify-end gap-0.5"
                        aria-label={`التقييم ${rating} من ${MAX_RATING}`}
                      >
                        {Array.from({ length: MAX_RATING }, (_, index) => {
                          const filled = index < rating;
                          return (
                            <Star
                              key={index}
                              className={
                                filled
                                  ? 'size-4 fill-star text-star'
                                  : 'size-4 text-star/30'
                              }
                            />
                          );
                        })}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
