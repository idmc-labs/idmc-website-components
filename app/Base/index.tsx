import React, { useCallback, useMemo } from 'react';
// import { Router } from 'react-router-dom';
import { init, ErrorBoundary } from '@sentry/react';
import {
    ApolloClient,
    ApolloProvider,
} from '@apollo/client';
import { unique } from '@togglecorp/fujs';

import '@togglecorp/toggle-ui/build/index.css';

import AlertContainer from '#components/AlertContainer';
import AlertContext, { AlertOptions } from '#components/AlertContext';
import Message from '#components/Message';

import LanguageContext, { Lang } from '#context/LanguageContext';
import apolloConfig from '#base/configs/apollo';
import useLocalStorage from '#hooks/useLocalStorage';
import { readRuntimeConfig } from '#utils/runtimeConfig';
import { parseQueryString, standaloneMode } from '#utils/common';

import Page from './Page';
import styles from './styles.css';

// NOTE: the config module is what pulls in the replay, tracing and profiling
// integrations, which together outweigh the reporting client. Loading it apart
// from the bundle keeps a deployment without a DSN from paying for them at all,
// and one with a DSN from paying for them before the page renders.
if (readRuntimeConfig(process.env.REACT_APP_SENTRY_DSN)) {
    import(/* webpackChunkName: "sentry" */ '#base/configs/sentry').then(
        ({ default: sentryConfig }) => {
            if (sentryConfig) {
                init(sentryConfig);
            }
        },
    );
}

const apolloClient = new ApolloClient(apolloConfig);

interface Win {
    page?: string;
}

interface Query {
    page?: string;
}

const query: Query = parseQueryString(window.location.search);

const currentPage = standaloneMode
    ? query.page
    : (window as Win).page;

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

    return (
        <div className={styles.base}>
            <ErrorBoundary
                showDialog
                fallback={(
                    <Message
                        heading="Oh no!"
                        message="Some error occurred!"
                    />
                )}
            >
                <ApolloProvider client={apolloClient}>
                    <LanguageContext.Provider value={languageContext}>
                        <AlertContext.Provider value={alertContext}>
                            <AlertContainer className={styles.alertContainer} />
                            <Page
                                className={styles.view}
                                name={currentPage}
                            />
                        </AlertContext.Provider>
                    </LanguageContext.Provider>
                </ApolloProvider>
            </ErrorBoundary>
        </div>
    );
}

export default Base;
