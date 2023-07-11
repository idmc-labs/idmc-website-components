import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';

import Home from '#views/Home';
import CountryProfile, { Props as CountryProfileProps } from '#views/CountryProfile';
import Gidd, { Props as GiddProps } from '#views/Gidd';
import GoodPractice from '#views/GoodPractice';
import GoodPractices from '#views/GoodPractices';
import IduMap from '#views/IduMap';
import ConflictWidget, { Props as ConflictWidgetProps } from '#views/ConflictWidget';
import DisasterWidget, { Props as DisasterWidgetProps } from '#views/DisasterWidget';
import IduWidget from '#views/IduWidget';
import {
    DATA_RELEASE,
} from '#utils/common';
import {
    GiddYearQuery,
    GiddYearQueryVariables,
} from '#generated/types';

const GIDD_YEAR = gql`
    query GiddYear(
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicYear(
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ) {
            year
        }
    }
`;

function useYear(clientId: string) {
    const variables = useMemo(() => ({
        releaseEnvironment: DATA_RELEASE,
        clientId,
    }), []);

    const {
        previousData,
        data = previousData,
        loading,
    } = useQuery<GiddYearQuery, GiddYearQueryVariables>(
        GIDD_YEAR,
        {
            variables,
            context: {
                clientName: 'helix',
            },
        },
    );

    const giddYear = data?.giddPublicYear?.year;

    return { loading, year: giddYear };
}

function CountryProfileWithYear(props: Omit<CountryProfileProps, 'endYear'> & { clientId: string }) {
    const { loading, year } = useYear(props.clientId);
    if (loading || !year) {
        return null;
    }
    return (
        <CountryProfile
            {...props}
            endYear={year}
        />
    );
}

function GiddWithYear(props: Omit<GiddProps, 'endYear'>) {
    const { loading, year } = useYear(props.clientId);
    if (loading || !year) {
        return null;
    }
    return (
        <Gidd
            {...props}
            endYear={year}
        />
    );
}

function ConflictWidgetWithYear(props: Omit<ConflictWidgetProps, 'endYear'>) {
    const { loading, year } = useYear(props.clientId);
    if (loading || !year) {
        return null;
    }
    return (
        <ConflictWidget
            {...props}
            endYear={year}
        />
    );
}

function DisasterWidgetWithYear(props: Omit<DisasterWidgetProps, 'endYear'>) {
    const { loading, year } = useYear(props.clientId);
    if (loading || !year) {
        return null;
    }
    return (
        <DisasterWidget
            {...props}
            endYear={year}
        />
    );
}

interface Props {
    className?: string;
    page?: string;
    iso3?: string;
    countryName?: string;
    standaloneMode: boolean;
    id?: string;
    clientId?: string;
    defaultClientId: string;
}

function Page(props: Props) {
    const {
        className,
        standaloneMode,
        id: currentId,
        countryName: currentCountryName,
        page,
        iso3: currentCountry,
        clientId: clientIdFromQuery,
        defaultClientId,
    } = props;

    const clientId = clientIdFromQuery || defaultClientId;

    if (page === 'good-practices') {
        return (
            <GoodPractices
                className={className}
            />
        );
    }
    if (page === 'good-practice') {
        if (!currentId) {
            return (
                <div>
                    Query parameter id is missing.
                </div>
            );
        }
        return (
            <GoodPractice
                className={className}
                id={currentId}
            />
        );
    }
    if (page === 'country-profile') {
        if (!currentCountry) {
            return (
                <div>
                    Query parameter iso3 is missing.
                </div>
            );
        }
        if (!clientId) {
            return (
                <div>
                    Client ID is missing.
                </div>
            );
        }

        return (
            <CountryProfileWithYear
                className={className}
                iso3={currentCountry}
                countryName={currentCountryName}
                clientId={clientId}
            />
        );
    }
    if (page === 'gidd') {
        if (!clientId) {
            return (
                <div>
                    Client ID is missing.
                </div>
            );
        }
        return (
            <GiddWithYear
                clientId={clientId}
            />
        );
    }
    if (page === 'idu-map') {
        if (!clientId) {
            return (
                <div>
                    Client ID is missing.
                </div>
            );
        }
        return (
            <IduMap
                clientId={clientId}
            />
        );
    }
    if (page === 'conflict-widget') {
        if (!clientId) {
            return (
                <div>
                    Client ID is missing.
                </div>
            );
        }
        if (!currentCountry) {
            return (
                <div>
                    Query parameter iso3 is missing.
                </div>
            );
        }
        return (
            <ConflictWidgetWithYear
                iso3={currentCountry}
                clientId={clientId}
            />
        );
    }
    if (page === 'disaster-widget') {
        if (!clientId) {
            return (
                <div>
                    Client ID is missing.
                </div>
            );
        }
        if (!currentCountry) {
            return (
                <div>
                    Query parameter iso3 is missing.
                </div>
            );
        }
        return (
            <DisasterWidgetWithYear
                iso3={currentCountry}
                clientId={clientId}
            />
        );
    }
    if (page === 'idu-widget') {
        if (!clientId) {
            return (
                <div>
                    Client ID is missing.
                </div>
            );
        }
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
                clientId={clientId}
            />
        );
    }

    if (standaloneMode) {
        return (
            <Home
                defaultClientId={defaultClientId}
            />
        );
    }

    return null;
}

export default Page;
