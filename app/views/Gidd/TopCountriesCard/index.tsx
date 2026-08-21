import React, { useMemo, useCallback } from 'react';
import { _cs, sum } from '@togglecorp/fujs';

import Header from '#components/Header';
import ListView from '#components/ListView';
import CountryBar from '#components/IduMap/TopCountries/CountryBar';

import {
    buildCausePhrase,
    buildTriggerFilterSuffix,
    formatAbbreviatedNumber,
} from '#utils/strings';

import {
    useCountryRanking,
    RankedCountry,
} from '../utils';

import styles from './styles.css';

const MAX_COUNTRIES = 5;

type Category = 'flow' | 'stock';
type Cause = 'conflict' | 'disaster';

export interface Props {
    className?: string;
    category: Category | undefined;
    cause: Cause | undefined;
    countriesIso3: string[];
    hazardTypes?: string[];
    violenceSubTypes?: string[];
    // e.g. "globally" / "in Sudan" — kept in sync with the "At a glance" slide
    scopeLabel: string;
    // trigger-type labels selected in each group, for the "... figures are
    // filtered to..." sentence(s); cause-adaptive like the "At a glance" slide
    disasterTriggerLabels: string[];
    conflictTriggerLabels: string[];
    startYear: number;
    endYear: number;
    clientCode: string;
    abbreviate: boolean;
    onCountrySelect?: (iso3: string) => void;
}

function TopCountriesCard(props: Props) {
    const {
        className,
        category,
        cause,
        countriesIso3,
        hazardTypes,
        violenceSubTypes,
        scopeLabel,
        disasterTriggerLabels,
        conflictTriggerLabels,
        startYear,
        endYear,
        clientCode,
        abbreviate,
        onCountrySelect,
    } = props;

    const isStock = category === 'stock';

    const { pending, rankedCountries } = useCountryRanking({
        category,
        cause,
        countriesIso3,
        hazardTypes,
        violenceSubTypes,
        startYear,
        endYear,
        clientId: clientCode,
    });

    const topCountries = useMemo(
        () => rankedCountries.slice(0, MAX_COUNTRIES),
        [rankedCountries],
    );

    const maxTotal = topCountries[0]?.total ?? 0;

    const heading = isStock
        ? 'Five countries reporting the largest displaced populations'
        : 'Five countries reporting the highest number of internal displacements';

    const topN = topCountries.length;
    const causeClause = buildCausePhrase(cause);
    const yearLabel = startYear === endYear ? `${endYear}` : `${startYear}-${endYear}`;
    // cause-adaptive: the opposite cause's figures aren't ranked, so its filter
    // sentence is suppressed even when its trigger types are selected
    const disasterSuffix = cause === 'conflict'
        ? ''
        : buildTriggerFilterSuffix({ cause: 'disaster', labels: disasterTriggerLabels });
    const conflictSuffix = cause === 'disaster'
        ? ''
        : buildTriggerFilterSuffix({ cause: 'conflict', labels: conflictTriggerLabels });
    const filterSuffix = `${disasterSuffix}${conflictSuffix}`;
    const countPhrase = topN === 1 ? 'country or territory' : 'countries and territories';

    let description: string;
    if (topN === 0) {
        description = isStock
            ? `No people living in displacement${causeClause} at the end of ${endYear}, ${scopeLabel}.${filterSuffix}`
            : `No internal displacements${causeClause} recorded ${scopeLabel} in ${yearLabel}.${filterSuffix}`;
    } else if (isStock) {
        description = `Top ${topN} ${countPhrase} by people living in displacement${causeClause} `
            + `at the end of ${endYear}, ${scopeLabel}.${filterSuffix}`;
    } else {
        const topSum = sum(topCountries.map((country) => country.total));
        const verb = topN === 1 ? 'accounts' : 'account';
        description = `Top ${topN} ${countPhrase} ${verb} for ${formatAbbreviatedNumber(topSum, abbreviate)} `
            + `internal displacements${causeClause} recorded ${scopeLabel} in ${yearLabel}.${filterSuffix}`;
    }
    // avoid flashing the "No ... recorded" empty sentence on the very first
    // load (refetches keep previous rows, so pending is only bare at startup)
    const headingDescription = pending && topN === 0 ? heading : description;

    const clickHint = 'Click a row to focus a country or territory.';
    const footer = isStock
        ? `People living in displacement at the end of ${endYear}. ${clickHint}`
        : `Internal displacements recorded in ${endYear}. ${clickHint}`;

    const countryKeySelector = useCallback((country: RankedCountry) => country.iso3, []);
    const countryRendererParams = useCallback((
        _: string,
        country: RankedCountry,
        index: number,
    ) => ({
        name: country.iso3,
        rank: index + 1,
        countryName: country.countryName,
        conflict: country.conflict,
        disaster: country.disaster,
        total: country.total,
        maxTotal,
        abbreviate,
        onClick: onCountrySelect,
    }), [maxTotal, abbreviate, onCountrySelect]);

    return (
        <div className={_cs(styles.topCountriesCard, className)}>
            <Header
                heading={heading}
                headingClassName={styles.slideHeading}
                headingSize="small"
                headingDescription={headingDescription}
                headingDescriptionClassName={styles.description}
            />
            <ListView
                className={styles.list}
                data={topCountries}
                keySelector={countryKeySelector}
                renderer={CountryBar}
                rendererParams={countryRendererParams}
                pending={pending}
                errored={false}
                filtered={false}
                messageShown
                compactPendingMessage
                emptyMessage="No data available for the selected filters."
            />
            {!pending && (
                <div className={styles.footer}>
                    {footer}
                </div>
            )}
        </div>
    );
}

export default TopCountriesCard;
