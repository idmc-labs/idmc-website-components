import React from 'react';
// import { Router } from 'react-router-dom';
import { init, ErrorBoundary } from '@sentry/react';
import { ApolloClient, ApolloProvider } from '@apollo/client';
import ReactGA from 'react-ga';
import { listToMap } from '@togglecorp/fujs';

import '@the-deep/deep-ui/build/index.css';
import 'mapbox-gl/dist/mapbox-gl.css';

import CountryProfile from '#views/CountryProfile';
import { setMapboxToken } from '@togglecorp/re-map';
import PreloadMessage from '#base/components/PreloadMessage';
import browserHistory from '#base/configs/history';
import sentryConfig from '#base/configs/sentry';
import apolloConfig from '#base/configs/apollo';
import { trackingId, gaConfig } from '#base/configs/googleAnalytics';
import { mapboxToken } from '#base/configs/env';

import styles from './styles.css';

setMapboxToken(mapboxToken);

if (sentryConfig) {
    init(sentryConfig);
}

if (trackingId) {
    ReactGA.initialize(trackingId, gaConfig);
    browserHistory.listen((location) => {
        const page = location.pathname ?? window.location.pathname;
        ReactGA.set({ page });
        ReactGA.pageview(page);
    });
}

const apolloClient = new ApolloClient(apolloConfig);

export function parseQueryString(value: string) {
    const val = value.substring(1);
    return listToMap(
        val.split('&').map((token) => token.split('=')),
        (item) => item[0],
        (item) => item[1],
    );
}

const query = parseQueryString(window.location.search);

const currentCountry = (window as { iso3?: string }).iso3
    || query.iso3;
const currentCountryName = (window as { countryName?: string }).countryName
    || query.countryName;

function Base() {
    return (
        <div className={styles.base}>
            <ErrorBoundary
                showDialog
                fallback={(
                    <PreloadMessage
                        heading="Oh no!"
                        content="Some error occurred!"
                    />
                )}
            >
                <ApolloProvider client={apolloClient}>
                    <CountryProfile
                        className={styles.view}
                        // NOTE: setting default country as nepal
                        iso3={currentCountry || 'MMR'}
                        countryName={currentCountry ? currentCountryName : 'Myanmar'}
                    />
                </ApolloProvider>
            </ErrorBoundary>
        </div>
    );
}

export default Base;
