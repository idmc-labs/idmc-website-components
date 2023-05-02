import React, { useMemo } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';

import Home from '#views/Home';
import CountryProfile from '#views/CountryProfile';
import Gidd from '#views/Gidd';
import GoodPractice from '#views/GoodPractice';
import GoodPractices from '#views/GoodPractices';
import IduMap from '#views/IduMap';
import ConflictWidget from '#views/ConflictWidget';
import DisasterWidget from '#views/DisasterWidget';
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
){
    giddYear(
        releaseEnvironment: $releaseEnvironment,
    ) {
        year
    }
}
`;
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

    const variables = useMemo(() => ({
        releaseEnvironment: DATA_RELEASE,
    }), []);

    const {
        data,
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

    const giddYear = data?.giddYear?.year;

    if (loading || !giddYear) {
        return null;
    }

    if (page === 'country-profile') {
        if (!currentCountry) {
            return (
                <div>
                    Query parameter iso3 is missing.
                </div>
            );
        }
        return (
            <CountryProfile
                className={className}
                iso3={currentCountry}
                countryName={currentCountryName}
                endYear={giddYear}
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
            <Gidd
                endYear={giddYear}
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
            <ConflictWidget
                iso3={currentCountry}
                endYear={giddYear}
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
            <DisasterWidget
                iso3={currentCountry}
                endYear={giddYear}
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
