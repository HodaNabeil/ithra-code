import { ExpandableContent } from '@/components/shared/expandable-content';
import { PathDetailDTO } from '@/types/path/path.dto';

interface PathHeroProps {
  path: PathDetailDTO;
}

export function PathHero({ path }: PathHeroProps) {
  return (
    <section>
      <div className="container">
        <div className="text-center flex flex-col items-center my-6 lg:my-10">
          <div className="text-brand text-sm mb-3 font-medium md:font-semibold">
            مسارات التعلم
          </div>
          <h1 className="text-4xl lg:text-5xl mb-8 text-foreground font-medium md:font-semibold">
            {path.title}
          </h1>
          <p className="text-lg lg:text-2xl text-muted-foreground max-w-prose">
            {path.tagline}
          </p>
        </div>

        {path.description && (
          <ExpandableContent
            initialHeight={200}
            expandLabel="عرض المزيد"
            collapseLabel="عرض أقل"
          >
            <div className="space-y-4 pt-2 font-sans mb-8">
              <h3 className="font-bold text-foreground text-xl md:text-2xl text-right">
                الوصف
              </h3>

              <div className="text-muted-foreground text-base leading-relaxed text-right whitespace-pre-line">
                {path.description}
              </div>
            </div>
          </ExpandableContent>
        )}
      </div>
    </section>
  );
}
