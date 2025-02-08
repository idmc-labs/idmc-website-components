import {
    BrowserOptions,
    browserProfilingIntegration,
    browserTracingIntegration,
    replayIntegration,
} from '@sentry/react';

const appCommitHash = process.env.REACT_APP_COMMITHASH;
const appName = process.env.MY_APP_ID;

const sentryDsn = process.env.REACT_APP_SENTRY_DSN;

const env = process.env.REACT_APP_ENVIRONMENT;

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
