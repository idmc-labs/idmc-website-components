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

    if (loading || data?.giddYear?.year) {
        return null;
    }

    if (page === 'country-profile' && currentCountry) {
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
                endYear={data.giddYear.year}
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
                endYear={data.giddYear.year}
            />
        );
    }
    if (page === 'good-practice' && currentId) {
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
                endYear={data.giddYear.year}
            />
        );
    }
    if (page === 'idu-map') {
        return (
            <IduMap
                endYear={data.giddYear.year}
            />
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
                endYear={data.giddYear.year}
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
                endYear={data.giddYear.year}
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
                endYear={data.giddYear.year}
            />
        );
    }

    return standaloneMode ? <Home /> : null;
    if (page === 'country-profile' && currentCountry) {
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
                endYear={data.giddYear.year}
            />
        );
    }
    if (page === 'good-practices') {
        return (
            <GoodPractices
                className={className}
                endYear={data.giddYear.year}
            />
        );
    }
    if (page === 'gidd') {
        return (
            <Gidd />
        );
    }
    if (page === 'good-practice' && currentId) {
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
                endYear={data.giddYear.year}
            />
        );
    }
    if (page === 'idu-map') {
        return (
            <IduMap
                endYear={data.giddYear.year}
            />
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
                endYear={data.giddYear.year}
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
                endYear={data.giddYear.year}
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
                endYear={data.giddYear.year}
                iso3={currentCountry}
            />
        );
    }

    return standaloneMode ? <Home /> : null;
}

export default Page;
