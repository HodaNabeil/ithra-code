import SectionHeading from './section-heading';

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
    <section className="py-12 md:py-16 lg:py-20 bg-muted/50">
      <div className="container element-center flex-col">
        <SectionHeading
          subTitle="آراء الطلاب"
          title="ماذا يقول طلابنا عن IthraCode"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 w-full">
          {items.map((testimonial) => {
            const avatarSrc = testimonial.avatarUrl || testimonial.avatar;
            const displayRole =
              testimonial.role ||
              (testimonial.source === 'review' ? 'طالب' : 'عميل');

            return (
              <div
                key={testimonial.id}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {displayRole}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {testimonial.content}
                </p>
                {testimonial.rating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < testimonial.rating!
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
