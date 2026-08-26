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
    getGoodPracticeLink,
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
    const [goodPracticeIdFromUser, setGoodPracticeIdFromUser] = useState<string | undefined>();

    const { data: mapResponse } = useQuery<
        AllCountriesQuery,
        AllCountriesQueryVariables
    >(GOOD_PRACTICE_MAP);

    const countriesFromResponse = mapResponse?.countryProfiles;
    const countries = countriesFromResponse
        ? [...countriesFromResponse].sort((a, b) => compareString(a.name, b.name))
        : undefined;

    const clientCode = clientCodeFromUser;
    const goodPracticeId = goodPracticeIdFromUser?.trim();

    return (
        <div
            className={styles.page}
        >
            <div className={styles.header}>
                <h1>
                    IDMC Website Components
                </h1>
                <div className={styles.spacer} />
                <a href={HELIX_REST_ENDPOINT}>
                    API Documentation
                </a>
            </div>
            <div className={styles.filters}>
                <TextInput
                    name="clientCode"
                    label="Client Code *"
                    value={clientCodeFromUser}
                    placeholder="xxxxxxxxxxxx"
                    onChange={setClientCodeFromUser}
                />
                <TextInput
                    name="goodPracticeId"
                    label="Good Practice Id"
                    value={goodPracticeIdFromUser}
                    placeholder="xx"
                    onChange={setGoodPracticeIdFromUser}
                />
            </div>
            <h2>
                Standalone Examples
            </h2>
            <p>
                Standalone mode lets any third-party site embed a component through an
                iframe, passing the country, client code and other options through the URL.
                It works on any site, with no whitelisting required.
            </p>
            <div className={styles.sections}>
                <div className={styles.section}>
                    <h3>
                        Country Profile
                    </h3>
                    <div className={styles.items}>
                        {countries?.map((country) => (
                            <a
                                key={country.iso3}
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
                    <h3>
                        Conflict Widget
                    </h3>
                    <div className={styles.items}>
                        {countries?.map((country) => (
                            <a
                                key={country.iso3}
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
                    <h3>
                        Disaster Widget
                    </h3>
                    <div className={styles.items}>
                        {countries?.map((country) => (
                            <a
                                key={country.iso3}
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
                    <h3>
                        IDU Widget
                    </h3>
                    <div className={styles.items}>
                        {countries?.map((country) => (
                            <a
                                key={country.iso3}
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
                    <h3>
                        Good Practices
                    </h3>
                    <a href={getGoodPracticesLink()}>
                        Global
                    </a>
                </div>
                <div className={styles.section}>
                    <h3>
                        Good Practice
                    </h3>
                    <a
                        aria-disabled={!goodPracticeId}
                        href={goodPracticeId
                            ? getGoodPracticeLink(goodPracticeId)
                            : undefined}
                    >
                        {goodPracticeId ?? 'Good Practice'}
                    </a>
                </div>
                <div className={styles.section}>
                    <h3>
                        IDU Map
                    </h3>
                    <a
                        aria-disabled={!clientCode}
                        href={clientCode
                            ? getIduLink(clientCode)
                            : undefined}
                    >
                        Global
                    </a>
                </div>
                <div className={styles.section}>
                    <h3>
                        GIDD
                    </h3>
                    <a
                        aria-disabled={!clientCode}
                        href={clientCode ? getGiddLink(clientCode) : undefined}
                    >
                        Global
                    </a>
                </div>
            </div>
            <h2>
                Embedded Examples
            </h2>
            <p>
                Embedded mode mounts a component directly into a host page instead of an
                iframe, allowing tighter integration such as shared Google Analytics.
                It is intended for IDMC&apos;s own website (internal-displacement.org) and
                requires the host domain to be whitelisted (CORS).
            </p>
            <div className={styles.sections}>
                <div className={styles.section}>
                    <h3>
                        Country Profile
                    </h3>
                    <a href="/embedded/examples/country-profile.html">
                        AFG
                    </a>
                </div>
                <div className={styles.section}>
                    <h3>
                        Conflict Widget
                    </h3>
                    <a href="/embedded/examples/conflict-widget.html">
                        AFG
                    </a>
                </div>
                <div className={styles.section}>
                    <h3>
                        Disaster Widget
                    </h3>
                    <a href="/embedded/examples/disaster-widget.html">
                        AFG
                    </a>
                </div>
                <div className={styles.section}>
                    <h3>
                        IDU Widget
                    </h3>
                    <a href="/embedded/examples/idu-widget.html">
                        AFG
                    </a>
                </div>
                <div className={styles.section}>
                    <h3>
                        Good Practices
                    </h3>
                    <a href="/embedded/examples/good-practices.html">
                        Global
                    </a>
                </div>
                <div className={styles.section}>
                    <h3>
                        Good Practice
                    </h3>
                    <a
                        aria-disabled={!goodPracticeId}
                        href={goodPracticeId
                            ? `/embedded/examples/good-practice.html?id=${encodeURIComponent(goodPracticeId)}`
                            : undefined}
                    >
                        {goodPracticeId ?? 'Good Practice'}
                    </a>
                </div>
                <div className={styles.section}>
                    <h3>
                        IDU Map
                    </h3>
                    <a href="/embedded/examples/idu-map.html">
                        Global
                    </a>
                    <a href="/embedded/examples/idu-map-real-global.html">
                        Real Global
                    </a>
                </div>
                <div className={styles.section}>
                    <h3>
                        GIDD
                    </h3>
                    <a href="/embedded/examples/gidd.html">
                        Global
                    </a>
                </div>
            </div>
            <p>
                Note: In embedded mode, the Client Code is taken from the environment,
                so the Client Code field above does not apply here.
                Also, the examples are static HTML files with their parameters
                (e.g. country) hardcoded in, so they cannot be changed here.
            </p>
        </div>
    );
}
export default Home;
