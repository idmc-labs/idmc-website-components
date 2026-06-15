import React from 'react';

import Home from '#views/Home';
import { CountryProfileWithYear } from '#views/CountryProfile';
import { GiddWithYear } from '#views/Gidd';
import GoodPractice from '#views/GoodPractice';
import GoodPractices from '#views/GoodPractices';
import IduMap from '#views/IduMap';
import { ConflictWidgetWithYear } from '#views/ConflictWidget';
import { DisasterWidgetWithYear } from '#views/DisasterWidget';
import IduWidget from '#views/IduWidget';
import DocumentTitle from '#components/DocumentTitle';
import Message from '#components/Message';
import { standaloneMode } from '#utils/common';
import {
    ReadResult,
    ReadSource,
} from '#utils/params';

interface LoaderProps {
    readString: (
        key: string,
        opts?: { required?: boolean; from?: ReadSource },
    ) => ReadResult<string>;
    readInteger: (
        key: string,
        opts?: { required?: boolean; from?: ReadSource },
    ) => ReadResult<number>;
    readClientCode: (opts?: { required?: boolean }) => ReadResult<string>;
    className?: string;
    route: RouteSetting;
}

export interface RouteSetting {
    pattern: string;
    title: string;
    category: string;
    loader: (props: LoaderProps) => React.ReactElement | null;
}

export const routeSettings: Record<string, RouteSetting> = {
    ...(standaloneMode ? {
        home: {
            pattern: '/',
            title: 'Home',
            category: 'Home',
            loader: () => <Home />,
        },
    } : {}),
    'good-practices': {
        pattern: '/good-practices',
        title: 'Good Practices',
        category: 'Good Practices',
        loader: ({ className }) => (
            <GoodPractices className={className} />
        ),
    },
    'good-practice': {
        pattern: '/good-practice/:id',
        title: 'Good Practice',
        category: 'Good Practices',
        loader: ({ readString, className }) => {
            const id = readString('id', { required: true, from: 'query' });
            if (id.error !== undefined) {
                return <Message message={id.error} />;
            }
            return (
                <>
                    <GoodPractice
                        className={className}
                        id={id.value}
                    />
                </>
            );
        },
    },
    'country-profile': {
        pattern: '/country-profiles/:iso3',
        title: 'Country Profile',
        category: 'Country Profiles',
        loader: ({ readClientCode, readString, route, className }) => {
            const clientCode = readClientCode({ required: true });
            if (clientCode.error !== undefined) {
                return <Message message={clientCode.error} />;
            }
            const iso3 = readString('iso3', { required: true });
            if (iso3.error !== undefined) {
                return <Message message={iso3.error} />;
            }
            const countryName = readString('countryName').value;
            return (
                <>
                    {/* Dynamic route title */}
                    <DocumentTitle value={`${route.title} | ${iso3.value}`} />
                    <CountryProfileWithYear
                        className={className}
                        iso3={iso3.value}
                        countryName={countryName}
                        clientCode={clientCode.value}
                    />
                </>
            );
        },
    },
    gidd: {
        pattern: '/gidd',
        title: 'GIDD Dashboard',
        category: 'GIDD',
        loader: ({ readClientCode }) => {
            const clientCode = readClientCode({ required: true });
            if (clientCode.error !== undefined) {
                return <Message message={clientCode.error} />;
            }
            return (
                <GiddWithYear
                    clientCode={clientCode.value}
                />
            );
        },
    },
    'idu-map': {
        pattern: '/idu',
        title: 'IDU Map',
        category: 'IDU',
        loader: ({ readClientCode }) => {
            const clientCode = readClientCode({ required: true });
            if (clientCode.error !== undefined) {
                return <Message message={clientCode.error} />;
            }
            return (
                <IduMap
                    clientCode={clientCode.value}
                />
            );
        },
    },
    'conflict-widget': {
        pattern: '/conflict/:iso3',
        title: 'Conflict Widget',
        category: 'Country Profiles',
        loader: ({ readClientCode, readString, route }) => {
            const clientCode = readClientCode({ required: true });
            if (clientCode.error !== undefined) {
                return <Message message={clientCode.error} />;
            }
            const iso3 = readString('iso3', { required: true });
            if (iso3.error !== undefined) {
                return <Message message={iso3.error} />;
            }
            return (
                <>
                    {/* Dynamic route title */}
                    <DocumentTitle value={`${route.title} | ${iso3.value}`} />
                    <ConflictWidgetWithYear
                        iso3={iso3.value}
                        clientCode={clientCode.value}
                    />
                </>
            );
        },
    },
    'disaster-widget': {
        pattern: '/disaster/:iso3',
        title: 'Disaster Widget',
        category: 'Country Profiles',
        loader: ({ readClientCode, readString, route }) => {
            const clientCode = readClientCode({ required: true });
            if (clientCode.error !== undefined) {
                return <Message message={clientCode.error} />;
            }
            const iso3 = readString('iso3', { required: true });
            if (iso3.error !== undefined) {
                return <Message message={iso3.error} />;
            }
            return (
                <>
                    {/* Dynamic route title */}
                    <DocumentTitle value={`${route.title} | ${iso3.value}`} />
                    <DisasterWidgetWithYear
                        iso3={iso3.value}
                        clientCode={clientCode.value}
                    />
                </>
            );
        },
    },
    'idu-widget': {
        pattern: '/idu/:iso3',
        title: 'IDU Widget',
        category: 'Country Profiles',
        loader: ({ readClientCode, readString, route }) => {
            const clientCode = readClientCode({ required: true });
            if (clientCode.error !== undefined) {
                return <Message message={clientCode.error} />;
            }
            const iso3 = readString('iso3', { required: true });
            if (iso3.error !== undefined) {
                return <Message message={iso3.error} />;
            }
            return (
                <>
                    {/* Dynamic route title */}
                    <DocumentTitle value={`${route.title} | ${iso3.value}`} />
                    <IduWidget
                        iso3={iso3.value}
                        clientCode={clientCode.value}
                    />
                </>
            );
        },
    },
};

export const notFoundRoute: RouteSetting = {
    pattern: '/404',
    title: 'Not Found',
    category: 'Error',
    loader: () => (
        <Message message="Some error occurred!" />
    ),
};
