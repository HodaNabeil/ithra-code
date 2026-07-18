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
      <SwaggerUI
        url="/api/openapi"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        persistAuthorization
      />
    </div>
  );
}
