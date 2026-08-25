import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SectionHeading from './section-heading';
import { TestimonialQuoteIcon } from './testimonial-quote-icon';

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
}

export default function TestimonialSection({
  items,
  hasError,
}: TestimonialSectionProps) {
  if (hasError || !items || items.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container element-center flex-col">
        <SectionHeading
          subTitle="آراء الطلاب"
          title="ماذا يقول طلابنا عن IthraCode"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 w-full">
          {items.map((testimonial) => {
            const avatarSrc = testimonial.avatarUrl || testimonial.avatar;

            return (
              <Card key={testimonial.id} className="h-full">
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
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
