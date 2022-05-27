import React, { useMemo } from 'react';
// import { Router } from 'react-router-dom';
import { init, ErrorBoundary } from '@sentry/react';
import { ApolloClient, ApolloProvider } from '@apollo/client';
import ReactGA from 'react-ga';
import { listToMap } from '@togglecorp/fujs';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@the-deep/deep-ui/build/esm/index.css';

import { setMapboxToken } from '@togglecorp/re-map';

import CountryProfile from '#views/CountryProfile';
import GoodPractice from '#views/GoodPractice';
import GoodPractices from '#views/GoodPractices';

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

interface Win {
    page?: string;

    // For country profile
    iso3?: string;
    countryName?: string;

    // For good practices
    id?: string;
}

const query: Win = parseQueryString(window.location.search);

const currentPage = (window as Win).page || query.page;

const currentCountry = (window as Win).iso3
    || query.iso3;
const currentCountryName = (window as Win).countryName
    || query.countryName;

const currentId = (window as Win).id || query.id;

function Base() {
    const page = useMemo(
        () => {
            if (currentPage === 'country-profile' && currentCountry) {
                return (
                    <CountryProfile
                        className={styles.view}
                        iso3={currentCountry}
                        countryName={currentCountryName}
                    />
                );
            }
            if (currentPage === 'good-practices') {
                return (
                    <GoodPractices
                        className={styles.view}
                    />
                );
            }
            if (currentPage === 'good-practice' && currentId) {
                return (
                    <GoodPractice
                        className={styles.view}
                        id={currentId}
                    />
                );
            }
            return (
                <>
                    <a href="/?page=country-profile&iso3=NPL&countryName=Nepal">
                        Country Profile (NPL)
                    </a>
                    <a href="/?page=country-profile&iso3=IND&countryName=India">
                        Country Profile (IND)
                    </a>
                    <a href="/?page=country-profile&iso3=MMR&countryName=Myanmar">
                        Country Profile (MMR)
                    </a>
                    <a href="/?page=country-profile&iso3=JPN&countryName=Japan">
                        Country Profile (JPN)
                    </a>
                    <a href="/?page=good-practices">
                        Good Practices
                    </a>
                    <a href="/?page=good-practice&id=1">
                        Good Practice (1)
                    </a>
                </>
            );
        },
        [],
    );

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
                    {page}
                </ApolloProvider>
            </ErrorBoundary>
        </div>
    );
}

export default Base;
