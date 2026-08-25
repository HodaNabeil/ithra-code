interface SectionHeadingProps {
  title: string;
  subTitle: string;
  className?: string;
}

const SectionHeading = ({
  title,
  subTitle,
  className = '',
}: SectionHeadingProps) => {
  return (
    <div className={`text-center space-y-3 ${className}`}>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
        {title}
      </h2>
      <span className="text-brand font-medium tracking-wider uppercase text-sm mb-2 block">
        {subTitle}
      </span>
    </div>
  );
};

export default SectionHeading;
