import React, { useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { compareString } from '@togglecorp/fujs';
import { TextInput } from '@togglecorp/toggle-ui';

import {
    AllCountriesQuery,
    AllCountriesQueryVariables,
} from '#generated/types';
import {
    getCountryProfileLink,
    getGoodPracticesLink,
    // getGoodPracticeLink,
    getIduLink,
    getGiddLink,
    getConflictWidgetLink,
    getDisasterWidgetLink,
    getIduWidgetLink,

    HELIX_REST_ENDPOINT,
} from '#utils/common';

import styles from './styles.css';

const GOOD_PRACTICE_MAP = gql`
query AllCountries {
    countryProfiles {
        id
        iso3
        name
    }
}
`;

function Home() {
    const [clientCodeFromUser, setClientCodeFromUser] = useState<string | undefined>();

    const { data: mapResponse } = useQuery<
        AllCountriesQuery,
        AllCountriesQueryVariables
    >(GOOD_PRACTICE_MAP);

    const countriesFromResponse = mapResponse?.countryProfiles;
    const countries = countriesFromResponse
        ? [...countriesFromResponse].sort((a, b) => compareString(a.name, b.name))
        : undefined;

    const clientCode = clientCodeFromUser;

    return (
        <div
            className={styles.page}
        >
            <h1>
                IDMC Website Components
            </h1>
            <div className={styles.filters}>
                <TextInput
                    name="clientCode"
                    label="Client Code *"
                    value={clientCodeFromUser}
                    placeholder="xxxxxxxxxxxx"
                    onChange={setClientCodeFromUser}
                />
            </div>
            <div className={styles.sections}>
                <div className={styles.section}>
                    <h2>
                        Country Profile
                    </h2>
                    <div className={styles.items}>
                        {countries?.map((country) => (
                            <a
                                key={country.iso3}
                                // className={!clientCode ? styles.disabledLink : undefined}
                                aria-disabled={!clientCode}
                                href={clientCode
                                    ? getCountryProfileLink(country.iso3, country.name, clientCode)
                                    : undefined}
                            >
                                {country.name}
                            </a>
                        ))}
                    </div>
                </div>
                <div className={styles.section}>
                    <h2>
                        Conflict Widget
                    </h2>
                    <div className={styles.items}>
                        {countries?.map((country) => (
                            <a
                                key={country.iso3}
                                // className={!clientCode ? styles.disabledLink : undefined}
                                aria-disabled={!clientCode}
                                href={clientCode
                                    ? getConflictWidgetLink(country.iso3, clientCode)
                                    : undefined}
                            >
                                {country.name}
                            </a>
                        ))}
                    </div>
                </div>
                <div className={styles.section}>
                    <h2>
                        Disaster Widget
                    </h2>
                    <div className={styles.items}>
                        {countries?.map((country) => (
                            <a
                                key={country.iso3}
                                // className={!clientCode ? styles.disabledLink : undefined}
                                aria-disabled={!clientCode}
                                href={clientCode
                                    ? getDisasterWidgetLink(country.iso3, clientCode)
                                    : undefined}
                            >
                                {country.name}
                            </a>
                        ))}
                    </div>
                </div>
                <div className={styles.section}>
                    <h2>
                        IDU Widget
                    </h2>
                    <div className={styles.items}>
                        {countries?.map((country) => (
                            <a
                                key={country.iso3}
                                // className={!clientCode ? styles.disabledLink : undefined}
                                aria-disabled={!clientCode}
                                href={clientCode
                                    ? getIduWidgetLink(country.iso3, clientCode)
                                    : undefined}
                            >
                                {country.name}
                            </a>
                        ))}
                    </div>
                </div>
                <div className={styles.section}>
                    <h2>
                        Good Practices
                    </h2>
                    <a href={getGoodPracticesLink()}>
                        Global
                    </a>
                </div>
                <div className={styles.section}>
                    <h2>
                        IDU Map
                    </h2>
                    <a
                        // className={!clientCode ? styles.disabledLink : undefined}
                        aria-disabled={!clientCode}
                        href={clientCode
                            ? getIduLink(clientCode)
                            : undefined}
                    >
                        Global
                    </a>
                </div>
                <div className={styles.section}>
                    <h2>
                        GIDD
                    </h2>
                    <a
                        // className={!clientCode ? styles.disabledLink : undefined}
                        aria-disabled={!clientCode}
                        href={clientCode ? getGiddLink(clientCode) : undefined}
                    >
                        Global
                    </a>
                </div>
                <div className={styles.section}>
                    <h2>
                        Rest Endpoints
                    </h2>
                    <a href={HELIX_REST_ENDPOINT}>
                        Swagger UI
                    </a>
                </div>
            </div>
        </div>
    );
}
export default Home;
