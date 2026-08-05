import {
    BrowserOptions,
    browserProfilingIntegration,
    browserTracingIntegration,
    replayIntegration,
} from '@sentry/react';
import { readRuntimeConfig } from '#utils/runtimeConfig';

const appCommitHash = process.env.REACT_APP_COMMITHASH;
const appName = process.env.MY_APP_ID;

// NOTE: reading the DSN through readRuntimeConfig() is what keeps the check below
// alive in the minified bundle, so a deployment that supplies no DSN really gets
// no Sentry -- rather than an initialised client with tracing, session replay and
// profiling attached to a DSN of `undefined`.
const sentryDsn = readRuntimeConfig(process.env.REACT_APP_SENTRY_DSN);

// NOTE: String() rather than readRuntimeConfig() so an environment that was never
// supplied tags events as `undefined`, instead of being dropped and letting Sentry
// apply its own `production` default.
const env = String(process.env.REACT_APP_ENVIRONMENT);

const sentryConfig: BrowserOptions | undefined = sentryDsn ? {
    dsn: sentryDsn,
    release: `${appName}@${appCommitHash}`,
    environment: env,
    // sendDefaultPii: true,
    normalizeDepth: 5,
    integrations: [
        // TODO: We should also set document response header to include
        // Document-Policy: js-profiling
        browserProfilingIntegration(),
        browserTracingIntegration(),
        replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    // FIXME: set this to the domains we have
    tracePropagationTargets: ['localhost', /^\//],
    replaysSessionSampleRate: 1.0,
    profilesSampleRate: 1.0,
} : undefined;

export default sentryConfig;
