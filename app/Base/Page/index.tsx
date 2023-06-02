import React, { useMemo } from 'react';
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
    HELIX_CLIENT_ID,
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

function useYear() {
    const variables = useMemo(() => ({
        releaseEnvironment: DATA_RELEASE,
        clientId: HELIX_CLIENT_ID,
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

function CountryProfileWithYear(props: Omit<CountryProfileProps, 'endYear'>) {
    const { loading, year } = useYear();
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
    const { loading, year } = useYear();
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
    const { loading, year } = useYear();
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
    const { loading, year } = useYear();
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
}

function Page(props: Props) {
    const {
        className,
        standaloneMode,
        id: currentId,
        countryName: currentCountryName,
        page,
        iso3: currentCountry,
    } = props;

    if (page === 'country-profile') {
        if (!currentCountry) {
            return (
                <div>
                    Query parameter iso3 is missing.
                </div>
            );
        }
        return (
            <CountryProfileWithYear
                className={className}
                iso3={currentCountry}
                countryName={currentCountryName}
            />
        );
    }
    if (page === 'good-practices') {
        return (
            <GoodPractices
                className={className}
            />
        );
    }
    if (page === 'gidd') {
        return (
            <GiddWithYear />
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
    if (page === 'idu-map') {
        return (
            <IduMap />
        );
    }
    if (page === 'conflict-widget') {
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
            />
        );
    }
    if (page === 'disaster-widget') {
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
            />
        );
    }
    if (page === 'idu-widget') {
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

    return standaloneMode ? <Home /> : null;
}

export default Page;
