import SectionHeading from './section-heading';
import Image from 'next/image';
import { ClockIcon, CodeIcon, VideoIcon } from '@radix-ui/react-icons';
import { WHY_IMAGE_SIZES } from '@/features/home/constants/image-sizes';
import { TestimonialQuoteIcon } from './testimonial-quote-icon';

const WhyIthraCode = () => {
  const cards = [
    {
      icon: <ClockIcon width={24} height={24} />,
      title: 'تعلم بسرعة وبإتقان',
      subTitle: 'لا يوجد تشتت وتكرار للمواضيع',
      desc: 'نركز على تقديم محتوى واضح وموجز وخالي من التعقيدات غير الضرورية. لا يوجد تشويش أو تكرار، فقط الأساسيات والمهارات العملية التي تحتاجها للنجاح في عالم البرمجة.',
      img: '/img/home/why-ithracode-speed.webp',
      width: 590,
      height: 437,
      sizes: WHY_IMAGE_SIZES[0],
    },
    {
      icon: <VideoIcon width={24} height={24} />,
      title: 'محاضرات خطوة بخطوة',
      subTitle: 'تعلم سهل ومتدرج للمبتدئين',
      desc: 'نتفهم أن تعلم البرمجة قد يكون تحديًا للمبتدئين. لذلك نقوم بتنظيم دوراتنا بعناية إلى خطوات بسيطة ومتدرجة تساعدك على بناء مهاراتك بثقة، خطوة واحدة في كل مرة.',
      img: '/img/home/why-ithracode-steps.webp',
      width: 453,
      height: 351,
      sizes: WHY_IMAGE_SIZES[1],
    },
    {
      icon: <CodeIcon width={24} height={24} />,
      title: 'التعلم من الواقع',
      subTitle: 'تطبيقات وخبرات حقيقية من الشركات',
      desc: 'نؤمن بأن أفضل طريقة للتعلم هي من خلال التجارب الواقعية. دوراتنا تعتمد على خبرات عملية من الشركات الحقيقية، مما يساعدك على فهم كيفية تطبيق المهارات في بيئة العمل الفعلية.',
      img: '/img/home/why-ithracode-practice.webp',
      width: 376,
      height: 456,
      sizes: WHY_IMAGE_SIZES[2],
    },
    {
      icon: <CodeIcon width={24} height={24} />,
      title: 'الاستعداد لسوق العمل',
      subTitle: 'من المبتدئ إلى المطور المحترف',
      desc: 'تم تصميم دوراتنا لتأهيلك لدخول سوق العمل بثقة. سواء كنت مبتدئًا أم تريد تطوير مهاراتك، ستتعلم المفاهيم والأدوات التي تحتاجها للحصول على فرص وظيفية ممتازة.',
      img: '/img/home/why-ithracode-career.webp',
      width: 375,
      height: 475,
      sizes: WHY_IMAGE_SIZES[3],
    },
  ];

  return (
    <section className="pt-12 md:pt-16 lg:pt-20">
      <div className="container element-center flex-col">
        <SectionHeading
          subTitle="الميزات"
          title="لماذا Ithra Code"
          icon={
            <TestimonialQuoteIcon
              gradientId="why-ithracode-quote"
              className="size-11 sm:size-12 md:size-14"
            />
          }
        />
        <ul className="w-full">
          {cards.map((card, index) => (
            <li
              key={index}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10 w-full items-center"
            >
              <div
                className={index === 1 || index === 3 ? 'md:order-last' : ''}
              >
                <div className="rounded-full mb-4 bg-primary/10 w-12 h-12 element-center text-primary">
                  {card.icon}
                </div>
                <p className="text-primary inline-block font-medium md:font-semibold">
                  {card.title}
                </p>
                <h2 className="text-3xl text-accent-foreground my-4">
                  {card.subTitle}
                </h2>
                <p className="text-muted-foreground text-lg">{card.desc}</p>
              </div>
              <div
                className={`${
                  index === 1 || index === 3 ? 'md:order-first' : ''
                } flex justify-center`}
              >
                <Image
                  src={card.img}
                  alt={card.title}
                  width={card.width}
                  height={card.height}
                  sizes={card.sizes}
                  className={`${
                    index === 0
                      ? 'w-5/6 md:w-full lg:pt-4 xl:w-5/6'
                      : index === 1
                        ? 'w-5/6 md:w-full md:pt-20 xl:w-3/5'
                        : 'w-3/5 md:w-4/6 md:pt-20 lg:pt-8 xl:w-2/5'
                  } object-cover`}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default WhyIthraCode;
