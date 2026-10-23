// Edge runtime Sentry init (middleware / edge routes). Loaded once from
// src/instrumentation.ts.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

import { getBaseSentryOptions } from './src/lib/sentry/sentry-config';

Sentry.init(getBaseSentryOptions('edge'));
