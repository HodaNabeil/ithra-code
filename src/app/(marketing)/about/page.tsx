import type { Metadata } from 'next';

import { Link } from '@/components/shared/link';
import { LegalDocumentLayout } from '@/components/shared/legal-document-layout';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { toMetaDescription } from '@/lib/seo/description';
import { JsonLd } from '@/lib/seo/json-ld/json-ld';
import { buildWebPageSchema } from '@/lib/seo/json-ld/builders/webpage';
import { getDefaultOrganizationSchema } from '@/lib/seo/json-ld/defaults';
import { buildJsonLdGraph } from '@/lib/seo/json-ld/types';
import { createPageMetadata } from '@/lib/seo/create-page-metadata';
import { getSiteOrigin, toCanonicalUrl } from '@/lib/seo/urls';

const ABOUT_TITLE = 'من نحن';
const ABOUT_DESCRIPTION =
  'تعرّف على IthraCode — منصة تعليمية عربية لتعلم البرمجة من خلال تجارب وخبرات واقعية.';

export const metadata: Metadata = createPageMetadata({
  title: ABOUT_TITLE,
  description: ABOUT_DESCRIPTION,
  path: PUBLIC_ROUTES.ABOUT,
});

function buildAboutPageJsonLd() {
  const origin = getSiteOrigin();
  const url = toCanonicalUrl(PUBLIC_ROUTES.ABOUT);

  return buildJsonLdGraph([
    getDefaultOrganizationSchema(origin),
    buildWebPageSchema({
      origin,
      path: PUBLIC_ROUTES.ABOUT,
      name: ABOUT_TITLE,
      description: toMetaDescription(ABOUT_DESCRIPTION),
      url,
    }),
  ]);
}

export default function AboutPage() {
  return (
    <LegalDocumentLayout>
      <JsonLd id="about-jsonld" data={buildAboutPageJsonLd()} />
      <h1>{ABOUT_TITLE}</h1>

      <p>
        <strong>IthraCode</strong> منصة تعليمية عربية لتعلم البرمجة من خلال
        تجارب وخبرات واقعية من الشركات. رسالتنا أن نُمكّن المتعلمين في
        العالم العربي من بناء مهارات عملية في تطوير الويب والبرمجة، والوصول
        إلى فرص وظيفية أفضل — تحت شعار «تعلم البرمجة من الواقع».
      </p>

      <h2>ماذا نقدّم</h2>
      <ul>
        <li>
          <strong>دورات عالية الجودة:</strong> محتوى تدريبي عملي يغطي مجالات
          متعددة في تطوير الويب والبرمجة.
        </li>
        <li>
          <strong>مسارات تعلّم منظّمة:</strong> مسارات متدرّجة تأخذ المتعلم من
          الأساسيات حتى الاحتراف خطوة بخطوة.
        </li>
        <li>
          <strong>التعلم من الواقع:</strong> خبرات عملية مرتبطة باحتياجات سوق
          العمل تساعدك على تطبيق ما تتعلّمه في مشاريع حقيقية.
        </li>
        <li>
          <strong>دعم ومتابعة:</strong> مجتمع ومتابعة تساعدك على الاستمرار حتى
          تحقيق أهدافك التعليمية.
        </li>
      </ul>

      <h2>مدرّبتك</h2>
      <p>
        تقود المنصة <strong>Hoda Abu Hashima</strong> — المؤسسة والمدرّبة
        الرئيسية (Founder &amp; Instructor). هدى مطوّرة واجهات أمامية
        (Frontend Engineer) متخصّصة في تصميم وبناء تطبيقات ويب حديثة وعالية
        الأداء وقابلة للتوسّع، بخبرة في React وNext.js وTypeScript، إلى جانب
        خلفية برمجية في C++ وJava. عملت كمدرّبة تقنية في عدد من المؤسسات
        التعليمية، وتبسّط المفاهيم البرمجية بأسلوب عملي ومنهجي عبر دوراتها
        ومحتواها التعليمي.
      </p>

      <h2>ابدأ رحلتك معنا</h2>
      <p>
        تصفّح <Link href={PUBLIC_ROUTES.COURSES}>دوراتنا</Link> أو{' '}
        <Link href={PUBLIC_ROUTES.LEARNING_PATHS}>مسارات التعلّم</Link> لتبدأ
        التعلّم اليوم، أو{' '}
        <Link href={PUBLIC_ROUTES.CONTACT}>تواصل معنا</Link> إذا كان لديك أي
        استفسار — يسعدنا دائمًا مساعدتك.
      </p>
    </LegalDocumentLayout>
  );
}
