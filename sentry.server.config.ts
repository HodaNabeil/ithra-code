// Node.js runtime Sentry init. Loaded once from src/instrumentation.ts.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

import { getBaseSentryOptions } from './src/lib/sentry/sentry-config';

Sentry.init(getBaseSentryOptions('server'));
