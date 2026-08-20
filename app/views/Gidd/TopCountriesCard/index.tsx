import React, { useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';

import Header from '#components/Header';
import Message from '#components/Message';
import CountryBar from '#components/IduMap/TopCountries/CountryBar';
import { DATA_RELEASE } from '#utils/common';
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    GiddTopCountriesQuery,
    GiddTopCountriesQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const MAX_COUNTRIES = 5;

const TOP_COUNTRIES = gql`
    query GiddTopCountries(
        $endYear: Float,
        $startYear: Float,
        $countriesIso3: [String!],
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicCountryDisplacements(
            countriesIso3: $countriesIso3,
            endYear: $endYear,
            startYear: $startYear,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ){
            iso3
            countryName
            conflictNewDisplacement
            conflictTotalDisplacement
            disasterNewDisplacement
            disasterTotalDisplacement
        }
    }
`;

type Category = 'flow' | 'stock';
type Cause = 'conflict' | 'disaster';

export interface Props {
    className?: string;
    category: Category | undefined;
    cause: Cause | undefined;
    countriesIso3: string[];
    startYear: number;
    endYear: number;
    clientCode: string;
    scopeLabel: string;
    abbreviate: boolean;
    onCountrySelect?: (iso3: string) => void;
}

function TopCountriesCard(props: Props) {
    const {
        className,
        category,
        cause,
        countriesIso3,
        startYear,
        endYear,
        clientCode,
        scopeLabel,
        abbreviate,
        onCountrySelect,
    } = props;

    const isStock = category === 'stock';
    const conflictShown = cause !== 'disaster';
    const disasterShown = cause !== 'conflict';

    const variables = useMemo(() => ({
        countriesIso3,
        startYear: isStock ? endYear : startYear,
        endYear,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [countriesIso3, isStock, startYear, endYear, clientCode]);

    const debouncedVariables = useDebouncedValue(variables);

    const {
        previousData,
        data = previousData,
        loading,
    } = useQuery<GiddTopCountriesQuery, GiddTopCountriesQueryVariables>(
        TOP_COUNTRIES,
        {
            variables: debouncedVariables,
            context: {
                clientName: 'helix',
            },
        },
    );

    const pending = loading && !data;

    const topCountries = useMemo(() => {
        const rows = data?.giddPublicCountryDisplacements ?? [];
        return rows
            .map((row) => {
                const conflict = (isStock
                    ? row.conflictTotalDisplacement
                    : row.conflictNewDisplacement) ?? 0;
                const disaster = (isStock
                    ? row.disasterTotalDisplacement
                    : row.disasterNewDisplacement) ?? 0;
                // the cause filter narrows what the bar is made of, so that the
                // ranking matches the rest of the dashboard
                const scopedConflict = conflictShown ? conflict : 0;
                const scopedDisaster = disasterShown ? disaster : 0;
                return {
                    iso3: row.iso3,
                    countryName: row.countryName,
                    conflict: scopedConflict,
                    disaster: scopedDisaster,
                    total: scopedConflict + scopedDisaster,
                };
            })
            .filter((row) => row.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, MAX_COUNTRIES);
    }, [data, isStock, conflictShown, disasterShown]);

    const maxTotal = topCountries[0]?.total ?? 0;

    const heading = isStock
        ? 'Largest displaced populations'
        : 'Five countries reporting the highest number of internal displacements';

    const description = isStock
        ? 'Top 5 countries and territories by people living in displacement '
            + `at the end of ${endYear}, ${scopeLabel}.`
        : 'Top 5 countries and territories by internal displacements '
            + `recorded in ${endYear}, ${scopeLabel}.`;

    const clickHint = 'Click a row to focus a country or territory.';
    const footer = isStock
        ? `People living in displacement at the end of ${endYear}. ${clickHint}`
        : `Internal displacements recorded in ${endYear}. ${clickHint}`;

    return (
        <div className={_cs(styles.topCountriesCard, className)}>
            <Header
                heading={heading}
                headingSize="small"
                headingDescription={description}
                headingDescriptionClassName={styles.description}
            />
            {pending ? (
                <Message pending compact />
            ) : (
                <>
                    <div className={styles.list}>
                        {topCountries.map((country, index) => (
                            <CountryBar
                                key={country.iso3}
                                rank={index + 1}
                                countryName={country.countryName}
                                conflict={country.conflict}
                                disaster={country.disaster}
                                total={country.total}
                                maxTotal={maxTotal}
                                abbreviate={abbreviate}
                                onClick={onCountrySelect
                                    ? () => onCountrySelect(country.iso3)
                                    : undefined}
                            />
                        ))}
                    </div>
                    <div className={styles.footer}>
                        {footer}
                    </div>
                </>
            )}
        </div>
    );
}

export default TopCountriesCard;
