'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import './swagger-ui.css';

const SwaggerUI = dynamic(
  () => import('swagger-ui-react').then((mod) => mod.default),
  { ssr: false },
);

export function SwaggerUIClient() {
  return (
    <div className="swagger-docs">
      <div className="swagger-topbar">
        <div className="swagger-topbar-wrapper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/swagger-logo.svg" alt="Swagger" height={40} />
        </div>
      </div>
      <SwaggerUI
        url="/api/openapi"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        persistAuthorization
      />
    </div>
  );
}
