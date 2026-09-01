import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  subTitle: string;
  className?: string;
  icon?: React.ReactNode;
}

const SectionHeading = ({
  title,
  subTitle,
  className = '',
  icon,
}: SectionHeadingProps) => {
  const heading = (
    <div className="space-y-3">
      <span className="text-brand font-medium tracking-wider uppercase text-sm block">
        {subTitle}
      </span>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
        {title}
      </h2>
    </div>
  );

  return (
    <div className={cn('mx-auto w-full max-w-3xl text-center', className)}>
      {icon ? (
        <div className="mx-auto w-fit">
          <div className="mb-3 flex justify-left">{icon}</div>
          {heading}
        </div>
      ) : (
        heading
      )}
    </div>
  );
};

export default SectionHeading;
