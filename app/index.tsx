// NOTE: first, and before any other import. It points the runtime at this app's
// own origin, and a chunk requested before it runs would be fetched from the
// embedding page's.
import './publicPath';

import React from 'react';
import ReactDom from 'react-dom';
import ReactGA from 'react-ga4';
import Base from './Base';

// NOTE: these are baked in as placeholders and only get their real value when
// the container starts (see ./web-app-serve/apply-config.sh), so they may be
// absent at runtime even though the bundler sees a constant. Reading them
// through String() keeps the minifier from folding the checks below away, and
// keeps an unset variable from throwing.
const TRACKING_ID = String(process.env.REACT_APP_GA_TRACKING_ID);
const environment = String(process.env.REACT_APP_ENVIRONMENT).toLowerCase();
const debugMode = environment.startsWith('alpha') || environment.startsWith('dev');

// Every GA4 measurement id starts with `G-`; anything else (unset, empty) means
// analytics is disabled for this deployment.
if (TRACKING_ID.startsWith('G-')) {
    ReactGA.initialize(TRACKING_ID, {
        gtagOptions: {
            send_page_view: false,
            debug_mode: debugMode, // NOTE: Enabling this to show hits in GA4 DebugView
        },
    });
}
// NOTE: let's enable strict mode
ReactDom.render(
    <Base />,
    document.getElementById('app-container'),
);
