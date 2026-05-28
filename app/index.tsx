import React from 'react';
import ReactDom from 'react-dom';
import ReactGA from 'react-ga4';
import Base from './Base';

const TRACKING_ID = process.env.REACT_APP_GA_TRACKING_ID;
const environment = process.env.NODE_ENV;
const debugMode = environment?.startsWith('ALPHA') || environment?.startsWith('dev');

if (TRACKING_ID) {
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
