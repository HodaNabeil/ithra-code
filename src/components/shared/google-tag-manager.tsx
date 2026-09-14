import { GTM_CONTAINER_ID } from '@/lib/seo/config';
import { isSeoIndexingEnabled } from '@/lib/seo/environment';

function buildGtmScript(gtmId: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`;
}

export function GoogleTagManagerScript() {
  if (!isSeoIndexingEnabled()) {
    return null;
  }

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: buildGtmScript(GTM_CONTAINER_ID),
      }}
    />
  );
}

export function GoogleTagManagerNoScript() {
  if (!isSeoIndexingEnabled()) {
    return null;
  }

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
