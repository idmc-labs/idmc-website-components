import React, { useCallback, useMemo } from 'react';
// import { Router } from 'react-router-dom';
import { init, ErrorBoundary } from '@sentry/react';
import { ApolloClient, ApolloProvider } from '@apollo/client';
import ReactGA from 'react-ga';
import { listToMap, unique } from '@togglecorp/fujs';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@togglecorp/toggle-ui/build/index.css';

import { setMapboxToken } from '@togglecorp/re-map';

import Home from '#views/Home';
import CountryProfile from '#views/CountryProfile';
import Gidd from '#views/Gidd';
import GoodPractice from '#views/GoodPractice';
import GoodPractices from '#views/GoodPractices';
import IduMap from '#views/IduMap';
import ConflictWidget from '#views/ConflictWidget';
import DisasterWidget from '#views/DisasterWidget';
import IduWidget from '#views/IduWidget';

import AlertContainer from '#components/AlertContainer';
import AlertContext, { AlertOptions } from '#components/AlertContext';

import LanguageContext, { Lang } from '#context/LanguageContext';
import PreloadMessage from '#base/components/PreloadMessage';
import browserHistory from '#base/configs/history';
import sentryConfig from '#base/configs/sentry';
import apolloConfig from '#base/configs/apollo';
import { trackingId, gaConfig } from '#base/configs/googleAnalytics';
import { mapboxToken } from '#base/configs/env';
import useLocalStorage from '#hooks/useLocalStorage';

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
    standaloneMode?: boolean;

    page?: string;

    // For country profile
    iso3?: string;
    countryName?: string;

    // For good practices
    id?: string;
}

const standaloneMode = (window as Win).standaloneMode ?? false;

const query: Win = parseQueryString(window.location.search);

const currentPage = (window as Win).page || query.page;

const currentCountry = (window as Win).iso3
    || query.iso3;
const currentCountryName = (window as Win).countryName
    || query.countryName;

const currentId = (window as Win).id || query.id;

function Base() {
    const [lang, setLang] = useLocalStorage<Lang>('idmc-website-language', 'en', false);

    const handleLanguageChange = useCallback((newLang: Lang) => {
        setLang(newLang);
        window.location.reload();
    }, [setLang]);

    const languageContext = useMemo(() => ({
        lang,
        setLang: handleLanguageChange,
        debug: false,
    }), [
        lang,
        handleLanguageChange,
    ]);

    const [alerts, setAlerts] = React.useState<AlertOptions[]>([]);

    const addAlert = React.useCallback(
        (alert: AlertOptions) => {
            setAlerts((prevAlerts) => unique(
                [...prevAlerts, alert],
                (a) => a.name,
            ) ?? prevAlerts);
        },
        [setAlerts],
    );

    const removeAlert = React.useCallback(
        (name: string) => {
            setAlerts((prevAlerts) => {
                const i = prevAlerts.findIndex((a) => a.name === name);
                if (i === -1) {
                    return prevAlerts;
                }

                const newAlerts = [...prevAlerts];
                newAlerts.splice(i, 1);

                return newAlerts;
            });
        },
        [setAlerts],
    );

    const updateAlertContent = React.useCallback(
        (name: string, children: React.ReactNode) => {
            setAlerts((prevAlerts) => {
                const i = prevAlerts.findIndex((a) => a.name === name);
                if (i === -1) {
                    return prevAlerts;
                }

                const updatedAlert = {
                    ...prevAlerts[i],
                    children,
                };

                const newAlerts = [...prevAlerts];
                newAlerts.splice(i, 1, updatedAlert);

                return newAlerts;
            });
        },
        [setAlerts],
    );
    const alertContext = React.useMemo(
        () => ({
            alerts,
            addAlert,
            updateAlertContent,
            removeAlert,
        }),
        [alerts, addAlert, updateAlertContent, removeAlert],
    );

    const page = useMemo(
        () => {
            if (currentPage === 'country-profile' && currentCountry) {
                if (!currentCountry) {
                    return (
                        <div>
                            Query parameter iso3 is missing.
                        </div>
                    );
                }
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
            if (currentPage === 'gidd') {
                return (
                    <Gidd />
                );
            }
            if (currentPage === 'good-practice' && currentId) {
                if (!currentId) {
                    return (
                        <div>
                            Query parameter id is missing.
                        </div>
                    );
                }
                return (
                    <GoodPractice
                        className={styles.view}
                        id={currentId}
                    />
                );
            }
            if (currentPage === 'idu-map') {
                return (
                    <IduMap />
                );
            }
            if (currentPage === 'conflict-widget') {
                if (!currentCountry) {
                    return (
                        <div>
                            Query parameter iso3 is missing.
                        </div>
                    );
                }
                return (
                    <ConflictWidget
                        iso3={currentCountry}
                    />
                );
            }
            if (currentPage === 'disaster-widget') {
                if (!currentCountry) {
                    return (
                        <div>
                            Query parameter iso3 is missing.
                        </div>
                    );
                }
                return (
                    <DisasterWidget
                        iso3={currentCountry}
                    />
                );
            }
            if (currentPage === 'idu-widget') {
                if (!currentCountry) {
                    return (
                        <div>
                            Query parameter iso3 is missing.
                        </div>
                    );
                }
                return (
                    <IduWidget
                        iso3={currentCountry}
                    />
                );
            }
            if (standaloneMode) {
                return (
                    <Home />
                );
            }
            return null;
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
                    <LanguageContext.Provider value={languageContext}>
                        <AlertContext.Provider value={alertContext}>
                            <AlertContainer className={styles.alertContainer} />
                            {page}
                        </AlertContext.Provider>
                    </LanguageContext.Provider>
                </ApolloProvider>
            </ErrorBoundary>
        </div>
    );
}

export default Base;
