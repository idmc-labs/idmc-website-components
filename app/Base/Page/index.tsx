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
} from '#utils/common';
import {
    GiddYearQuery,
    GiddYearQueryVariables,
} from '#generated/types';

import styles from './styles.css';

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

function useYear(clientCode: string) {
    const variables = useMemo((): GiddYearQueryVariables => ({
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [clientCode]);

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

function CountryProfileWithYear(props: Omit<CountryProfileProps, 'endYear'> & { clientCode: string }) {
    const { loading, year } = useYear(props.clientCode);
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
    const { loading, year } = useYear(props.clientCode);
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
    const { loading, year } = useYear(props.clientCode);
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
    const { loading, year } = useYear(props.clientCode);
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
    clientCode?: string;
    defaultClientCode: string;
}

function Page(props: Props) {
    const {
        className,
        standaloneMode,
        id: currentId,
        countryName: currentCountryName,
        page,
        iso3: currentCountry,
        clientCode,
        defaultClientCode,
    } = props;

    // const clientCode = clientCodeFromQuery || defaultClientCode;

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
                <div className={styles.message}>
                    <div>
                        Query parameter id is missing.
                    </div>
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
                <div className={styles.message}>
                    <div>
                        Query parameter iso3 is missing.
                    </div>
                </div>
            );
        }
        if (!clientCode) {
            return (
                <div className={styles.message}>
                    <div>
                        Client code is missing.
                    </div>
                </div>
            );
        }

        return (
            <CountryProfileWithYear
                className={className}
                iso3={currentCountry}
                countryName={currentCountryName}
                clientCode={clientCode}
            />
        );
    }
    if (page === 'gidd') {
        if (!clientCode) {
            return (
                <div className={styles.message}>
                    <div>
                        Client code is missing.
                    </div>
                </div>
            );
        }
        return (
            <GiddWithYear
                clientCode={clientCode}
            />
        );
    }
    if (page === 'idu-map') {
        if (!clientCode) {
            return (
                <div className={styles.message}>
                    <div>
                        Client code is missing.
                    </div>
                </div>
            );
        }
        return (
            <IduMap
                clientCode={clientCode}
            />
        );
    }
    if (page === 'conflict-widget') {
        if (!clientCode) {
            return (
                <div className={styles.message}>
                    <div>
                        Client code is missing.
                    </div>
                </div>
            );
        }
        if (!currentCountry) {
            return (
                <div className={styles.message}>
                    <div>
                        Query parameter iso3 is missing.
                    </div>
                </div>
            );
        }
        return (
            <ConflictWidgetWithYear
                iso3={currentCountry}
                clientCode={clientCode}
            />
        );
    }
    if (page === 'disaster-widget') {
        if (!clientCode) {
            return (
                <div className={styles.message}>
                    <div>
                        Client code is missing.
                    </div>
                </div>
            );
        }
        if (!currentCountry) {
            return (
                <div className={styles.message}>
                    <div>
                        Query parameter iso3 is missing.
                    </div>
                </div>
            );
        }
        return (
            <DisasterWidgetWithYear
                iso3={currentCountry}
                clientCode={clientCode}
            />
        );
    }
    if (page === 'idu-widget') {
        if (!clientCode) {
            return (
                <div className={styles.message}>
                    <div>
                        Client code is missing.
                    </div>
                </div>
            );
        }
        if (!currentCountry) {
            return (
                <div className={styles.message}>
                    <div>
                        Query parameter iso3 is missing.
                    </div>
                </div>
            );
        }
        return (
            <IduWidget
                iso3={currentCountry}
                clientCode={clientCode}
            />
        );
    }

    if (standaloneMode) {
        return (
            <Home
                defaultClientCode={defaultClientCode}
            />
        );
    }

    return null;
}

export default Page;
