/** Arabic brand name. */
export const SEO_SITE_NAME_AR = 'إثراء كود';

/** Latin brand used for Open Graph `siteName`, JSON-LD, and document title suffix. */
export const SEO_SITE_NAME_EN = 'Ithra Code';

/** Alternate spellings used in structured data. */
export const SEO_SITE_ALTERNATE_NAMES = [
  'IthraCode',
  'إثراء كود',
  'ithra code',
] as const;

/** Production canonical origin for metadata and JSON-LD when indexing is enabled. */
export const SEO_CANONICAL_ORIGIN = 'https://ithracode.tech';

export const SEO_OG_LOCALE = 'ar_EG';

export const SEO_HTML_LANGUAGE = 'ar';

/** Value proposition for inner pages and WebPage schema on the home page. */
export const SEO_DEFAULT_TITLE = 'تعلم البرمجة من الواقع';

/** Full document title for the home page (`absolute` metadata). */
export const SEO_HOME_DOCUMENT_TITLE =
  'Ithra Code | إثراء كود - تعلم البرمجة من الواقع';

/** Root layout title template segment (`%s | Ithra Code`). */
export const SEO_TITLE_TEMPLATE_SUFFIX = SEO_SITE_NAME_EN;

export const SEO_DEFAULT_DESCRIPTION =
  'إثراء كود — منصة عربية لتعلم البرمجة من الواقع، من أساسيات تطوير الويب إلى React وNext.js وهندسة البرمجيات.';

export const SEO_LOGO_PATH = '/img/ithracode.png';

export const SEO_DEFAULT_OG_IMAGE_PATH = '/img/ithracode.png';

export const SEO_OG_IMAGE_WIDTH = 1200;

export const SEO_OG_IMAGE_HEIGHT = 630;

export const SEO_TWITTER_SITE = '@ithracode';

/** Public English name shown above the Arabic name. */
export const SEO_AUTHOR_NAME = 'Hoda Nabeil';

/** Public Arabic name. */
export const SEO_AUTHOR_NAME_AR = 'هدى نبيل';

/** Extra Latin spelling for search only. */
export const SEO_AUTHOR_ALTERNATE_NAMES = [] as const;

export const SEO_AUTHOR_JOB_TITLE = 'Founder, Software Engineer & Instructor';

const SEO_BRAND_KEYWORDS = [
  'Ithra Code',
  'IthraCode',
  'إثراء كود',
  'تعلم البرمجة',
  'Next.js',
  'Software Architecture',
] as const;

export const SEO_GLOBAL_KEYWORDS = [...SEO_BRAND_KEYWORDS] as const;

export const SEO_HOME_KEYWORDS = [
  ...SEO_BRAND_KEYWORDS,
  'برمجة',
  'React',
  'JavaScript',
  'تطوير الويب',
  SEO_AUTHOR_NAME,
  SEO_AUTHOR_NAME_AR,
] as const;

/**
 * Public social profiles that actually appear in the footer.
 * Twitter/X is omitted — there is no public Twitter URL in the product.
 */
export const SEO_SAME_AS = [
  'https://www.linkedin.com/in/hoda-nabeil-144094225/',
  'https://youtube.com/@ithracode',
  'https://www.facebook.com/profile.php?id=61594744076040',
] as const;

export const SEO_META_DESCRIPTION_MAX_LENGTH = 160;

export const SEO_COURSE_SEARCH_PATH = '/courses';

export const SEO_COURSE_SEARCH_QUERY_PARAM = 'search';

/** Google Search Console site ownership verification token. */
export const SEO_GOOGLE_SITE_VERIFICATION =
  '5y-OWAMpRHmTG04E1uwGxWxErgzcuEqkAiGE50X0sL4';

/** Google Tag Manager container ID. */
export const GTM_CONTAINER_ID = 'GTM-K5XRQW2Z';
