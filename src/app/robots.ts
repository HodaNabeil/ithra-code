import { env } from '@/config/env';
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/instructor/',
        '/api/',
        '/auth/',
        '/payment/',
        '/success/',
        '/unauthorized/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
