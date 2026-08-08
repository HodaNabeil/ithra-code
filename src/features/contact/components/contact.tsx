import { Link } from '@/components/shared/link';

import ContactForm from './contact-form';
import ContactHeader from './contact-header';
import { APP_ROUTES } from '@/constants/enums';

export default function Contact() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <ContactHeader />

      <div className="flex w-full flex-col gap-6 rounded-lg border border-border p-4">
        <p className="text-muted-foreground">
          للحصول على اقتراحات الدورة التدريبية والنصائح المهنية، تحقق معنا{' '}
          <Link
            href={APP_ROUTES.LEARNING_PATHS}
            className="text-primary border-b border-primary hover:border-transparent"
          >
            مسارات التعلم
          </Link>
        </p>
        <ContactForm />
      </div>
    </div>
  );
}
