import React, { useMemo, useLayoutEffect } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { addBreadcrumb } from '@sentry/react';

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
    // eslint-disable-next-line react/destructuring-assignment
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
    // eslint-disable-next-line react/destructuring-assignment
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
    // eslint-disable-next-line react/destructuring-assignment
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
    // eslint-disable-next-line react/destructuring-assignment
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

export interface DocumentTitleProps {
    value: string;
    standaloneMode: boolean;
}

function DocumentTitle({ value, standaloneMode }: DocumentTitleProps) {
    useLayoutEffect(
        () => {
            if (standaloneMode) {
                document.title = value;
            }
            addBreadcrumb({
                category: 'navigation',
                message: `Component Mount: ${value}`,
                level: 'info',
            });
        },
        [value, standaloneMode],
    );
    return null;
}

interface Props {
    className?: string;
    page?: string;
    iso3?: string;
    countryName?: string;
    standaloneMode: boolean;
    id?: string;
    clientCode?: string;
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
    } = props;

    if (page === 'good-practices') {
        return (
            <>
                <DocumentTitle
                    standaloneMode={standaloneMode}
                    value="Good Practices"
                />
                <GoodPractices
                    className={className}
                />
            </>
        );
    }
    if (page === 'good-practice') {
        if (!currentId) {
            return (
                <div className={styles.message}>
                    <DocumentTitle
                        value="Good Practice"
                        standaloneMode={standaloneMode}
                    />
                    <div>
                        Query parameter id is missing.
                    </div>
                </div>
            );
        }
        return (
            <>
                <DocumentTitle
                    value={`Good Practice | ${currentId}`}
                    standaloneMode={standaloneMode}
                />
                <GoodPractice
                    className={className}
                    id={currentId}
                />
            </>
        );
    }
    if (page === 'country-profile') {
        if (!currentCountry) {
            return (
                <div className={styles.message}>
                    <DocumentTitle
                        value="Country Profile"
                        standaloneMode={standaloneMode}
                    />
                    <div>
                        Query parameter iso3 is missing.
                    </div>
                </div>
            );
        }
        if (!clientCode) {
            return (
                <div className={styles.message}>
                    <DocumentTitle
                        value="Country Profile"
                        standaloneMode={standaloneMode}
                    />
                    <div>
                        Client code is missing.
                    </div>
                </div>
            );
        }

        return (
            <>
                <DocumentTitle
                    value={`Country Profile | ${currentCountry}`}
                    standaloneMode={standaloneMode}
                />
                <CountryProfileWithYear
                    className={className}
                    iso3={currentCountry}
                    countryName={currentCountryName}
                    clientCode={clientCode}
                />
            </>
        );
    }
    if (page === 'gidd') {
        if (!clientCode) {
            return (
                <div className={styles.message}>
                    <DocumentTitle
                        value="GIDD Dashboard"
                        standaloneMode={standaloneMode}
                    />
                    <div>
                        Client code is missing.
                    </div>
                </div>
            );
        }
        return (
            <>
                <DocumentTitle
                    value="GIDD Dashboard"
                    standaloneMode={standaloneMode}
                />
                <GiddWithYear
                    clientCode={clientCode}
                />
            </>
        );
    }
    if (page === 'idu-map') {
        if (!clientCode) {
            return (
                <div className={styles.message}>
                    <DocumentTitle
                        value="IDU Map"
                        standaloneMode={standaloneMode}
                    />
                    <div>
                        Client code is missing.
                    </div>
                </div>
            );
        }
        return (
            <>
                <DocumentTitle
                    value="IDU Map"
                    standaloneMode={standaloneMode}
                />
                <IduMap
                    clientCode={clientCode}
                />
            </>
        );
    }
    if (page === 'conflict-widget') {
        if (!clientCode) {
            return (
                <div className={styles.message}>
                    <DocumentTitle
                        value="Confilct"
                        standaloneMode={standaloneMode}
                    />
                    <div>
                        Client code is missing.
                    </div>
                </div>
            );
        }
        if (!currentCountry) {
            return (
                <div className={styles.message}>
                    <DocumentTitle
                        value="Confilct"
                        standaloneMode={standaloneMode}
                    />
                    <div>
                        Query parameter iso3 is missing.
                    </div>
                </div>
            );
        }
        return (
            <>
                <DocumentTitle
                    value={`Conflict | ${currentCountry}`}
                    standaloneMode={standaloneMode}
                />
                <ConflictWidgetWithYear
                    iso3={currentCountry}
                    clientCode={clientCode}
                />
            </>
        );
    }
    if (page === 'disaster-widget') {
        if (!clientCode) {
            return (
                <div className={styles.message}>
                    <DocumentTitle
                        value="Disaster"
                        standaloneMode={standaloneMode}
                    />
                    <div>
                        Client code is missing.
                    </div>
                </div>
            );
        }
        if (!currentCountry) {
            return (
                <div className={styles.message}>
                    <DocumentTitle
                        value="Disaster"
                        standaloneMode={standaloneMode}
                    />
                    <div>
                        Query parameter iso3 is missing.
                    </div>
                </div>
            );
        }
        return (
            <>
                <DocumentTitle
                    value={`Disaster | ${currentCountry}`}
                    standaloneMode={standaloneMode}
                />
                <DisasterWidgetWithYear
                    iso3={currentCountry}
                    clientCode={clientCode}
                />
            </>
        );
    }
    if (page === 'idu-widget') {
        if (!clientCode) {
            return (
                <div className={styles.message}>
                    <DocumentTitle
                        value="IDU"
                        standaloneMode={standaloneMode}
                    />
                    <div>
                        Client code is missing.
                    </div>
                </div>
            );
        }
        if (!currentCountry) {
            return (
                <div className={styles.message}>
                    <DocumentTitle
                        value="IDU"
                        standaloneMode={standaloneMode}
                    />
                    <div>
                        Query parameter iso3 is missing.
                    </div>
                </div>
            );
        }
        return (
            <>
                <DocumentTitle
                    value={`IDU | ${currentCountry}`}
                    standaloneMode={standaloneMode}
                />
                <IduWidget
                    iso3={currentCountry}
                    clientCode={clientCode}
                />
            </>
        );
    }

    if (standaloneMode) {
        return (
            <>
                <DocumentTitle
                    value="Home"
                    standaloneMode={standaloneMode}
                />
                <Home />
            </>
        );
    }

    return (
        <div className={styles.message}>
            <DocumentTitle
                value="404"
                standaloneMode={standaloneMode}
            />
            <div>
                Some error occurred!
            </div>
        </div>
    );
}

export default Page;
