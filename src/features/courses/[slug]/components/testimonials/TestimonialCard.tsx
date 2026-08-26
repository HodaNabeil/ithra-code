import * as React from 'react';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface Testimonial {
  id: number;
  name: string;
  initial: string;
  avatar?: string;
  rating: number;
  text: string;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="testimonial-card border border-border/40 rounded-2xl p-8 h-full flex flex-col justify-between">
      <div className="flex flex-col">
        <p className="text-muted-foreground text-base leading-relaxed mb-8">
          {testimonial.text}
        </p>

        <div className="w-12 h-0.5 bg-muted-foreground/30 mb-8" />
      </div>

      <div className="flex items-center gap-4 mt-auto">
        <Avatar className="h-10 w-10 border border-border/50">
          {testimonial.avatar ? (
            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
          ) : null}
          <AvatarFallback className="bg-foreground text-background text-xs font-bold">
            {testimonial.initial}
          </AvatarFallback>
        </Avatar>
        <div className="text-right">
          <p className="font-bold text-foreground text-sm">
            .{testimonial.name}
          </p>
          <div className="flex gap-0.5 mt-1">
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-star text-star" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
