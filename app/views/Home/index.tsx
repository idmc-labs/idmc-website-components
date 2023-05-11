import React from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';

import {
    AllCountriesQuery,
    AllCountriesQueryVariables,
} from '#generated/types';
import { compareString } from '@togglecorp/fujs';
import {
    getCountryProfileLink,
    getGoodPracticesLink,
    // getGoodPracticeLink,
    getIduLink,
    getGiddLink,
    getConflictWidgetLink,
    getDisasterWidgetLink,
    getIduWidgetLink,
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
    const { data: mapResponse } = useQuery<
        AllCountriesQuery,
        AllCountriesQueryVariables
    >(GOOD_PRACTICE_MAP);

    const countriesFromResponse = mapResponse?.countryProfiles;
    const countries = countriesFromResponse
        ? [...countriesFromResponse].sort((a, b) => compareString(a.name, b.name))
        : undefined;

    return (
        <div
            className={styles.page}
        >
            <h1>
                IDMC Website Components
            </h1>
            <div className={styles.sections}>
                <div className={styles.section}>
                    <h2>
                        Country Profile
                    </h2>
                    <div className={styles.items}>
                        {countries?.map((country) => (
                            <a
                                key={country.iso3}
                                href={getCountryProfileLink(country.iso3, country.name)}
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
                                href={getConflictWidgetLink(country.iso3)}
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
                                href={getDisasterWidgetLink(country.iso3)}
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
                                href={getIduWidgetLink(country.iso3)}
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
                    <a href={getIduLink()}>
                        Global
                    </a>
                </div>
                <div className={styles.section}>
                    <h2>
                        GIDD
                    </h2>
                    <a href={getGiddLink()}>
                        Global
                    </a>
                </div>
            </div>
        </div>
    );
}
export default Home;
