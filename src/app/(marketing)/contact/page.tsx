import { Link } from '@/components/shared/link';
import { Card, CardContent } from '@/components/ui/card';
import { APP_ROUTES } from '@/constants/enums';
import ContactForm from '@/features/contact/components/contact-form';
import ContactHeader from '@/features/contact/components/contact-header';
import { buildContactPageMetadata } from '@/features/contact/lib/seo/contact-page-metadata';
import { buildContactPageJsonLd } from '@/features/contact/lib/seo/contact-page-schema.adapter';
import { auth } from '@/lib/auth';
import { JsonLd } from '@/lib/seo/json-ld/json-ld';

export const generateMetadata = buildContactPageMetadata;

export default async function ContactPage() {
  const session = await auth();

  const userDefaults = session?.user?.id
    ? {
        name: session.user.name?.trim() ?? '',
        email: session.user.email?.trim() ?? '',
      }
    : undefined;

  return (
    <div className="py-12 md:py-16">
      <JsonLd id="contact-jsonld" data={buildContactPageJsonLd()} />
      <div className="container flex min-h-[calc(100dvh-5rem)] items-center justify-center">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <ContactHeader />

          <Card className="w-full gap-0 py-0 shadow-sm">
            <CardContent className="flex flex-col gap-6 p-4 sm:p-6">
              <p className="text-muted-foreground">
                للحصول على اقتراحات الدورة التدريبية والنصائح المهنية، تحقق معنا{' '}
                <Link
                  href={APP_ROUTES.LEARNING_PATHS}
                  className="text-primary border-b border-primary hover:border-transparent"
                >
                  مسارات التعلم
                </Link>
              </p>
              <ContactForm userDefaults={userDefaults} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
