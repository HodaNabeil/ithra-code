declare module 'swagger-ui-react' {
  import type { ComponentType } from 'react';

  export interface SwaggerUIProps {
    url?: string;
    docExpansion?: string;
    defaultModelsExpandDepth?: number;
    persistAuthorization?: boolean;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
