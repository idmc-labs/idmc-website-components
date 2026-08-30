import React, { useMemo, useCallback } from 'react';
import {
    _cs,
    listToGroupList,
    mapToList,
    sum,
    compareNumber,
    formatDateToString,
    decodeDate,
} from '@togglecorp/fujs';

import ListView from '#components/ListView';
import { IduDataQuery } from '#generated/types';

import CountryBar, { Props as CountryBarProps } from './CountryBar';

import styles from './styles.css';

type IduRow = NonNullable<IduDataQuery['idu']>[number];

const MAX_COUNTRIES = 5;

const formatDate = (date: string | undefined) => (
    date ? formatDateToString(decodeDate(date), 'dd MMM yyyy') : ''
);

interface CountryDatum {
    key: string;
    countryName: string | undefined | null;
    conflict: number;
    disaster: number;
    total: number;
}

const keySelector = (item: CountryDatum) => item.key;

function displacementTerm(cause: 'all' | 'Conflict' | 'Disaster'): string {
    if (cause === 'Disaster') return 'disaster';
    if (cause === 'Conflict') return 'conflict and violence';
    return 'internal';
}

interface Props {
    className?: string;
    idus: IduRow[] | undefined;
    cause: 'all' | 'Conflict' | 'Disaster';
    startDate: string | undefined;
    endDate: string | undefined;
    onCountrySelect?: (iso3: string) => void;
    selectedIso3: string | undefined;
}

function TopCountries(props: Props) {
    const {
        className,
        idus,
        cause,
        startDate,
        endDate,
        onCountrySelect,
        selectedIso3,
    } = props;

    const countries = useMemo<CountryDatum[]>(() => {
        const grouped = listToGroupList(idus ?? [], (d) => d.iso3 ?? '');
        const list = mapToList(grouped, (items) => {
            const first = items[0];
            const conflict = sum(
                items
                    .filter((item) => item.displacement_type === 'Conflict')
                    .map((item) => item.figure),
            );
            const disaster = sum(
                items
                    .filter((item) => item.displacement_type === 'Disaster')
                    .map((item) => item.figure),
            );
            return {
                key: first.iso3 ?? '',
                countryName: first.country,
                conflict,
                disaster,
                total: conflict + disaster,
            };
        });

        return [...list]
            .filter((country) => country.total > 0)
            .sort((a, b) => compareNumber(a.total, b.total, -1))
            .slice(0, MAX_COUNTRIES);
    }, [idus]);

    const maxTotal = countries[0]?.total ?? 0;

    const rendererParams = useCallback((
        _: string,
        country: CountryDatum,
        index: number,
    ): CountryBarProps => ({
        name: country.key,
        rank: index + 1,
        countryName: country.countryName,
        conflict: country.conflict,
        disaster: country.disaster,
        total: country.total,
        maxTotal,
        onClick: country.key ? onCountrySelect : undefined,
        selected: country.key === selectedIso3,
    }), [maxTotal, onCountrySelect, selectedIso3]);

    const description = `Between ${formatDate(startDate)} - ${formatDate(endDate)}, IDMC recorded the highest numbers of ${displacementTerm(cause)} displacements in the following countries.`;

    return (
        <div className={_cs(styles.topCountries, className)}>
            <div className={styles.heading}>
                Countries with the highest numbers of internal displacements
            </div>
            <div className={styles.description}>
                {description}
            </div>
            <div className={styles.list}>
                <ListView
                    data={countries}
                    keySelector={keySelector}
                    renderer={CountryBar}
                    rendererParams={rendererParams}
                    direction="vertical"
                    errored={false}
                    pending={false}
                    filtered={false}
                    messageShown
                    emptyMessage="No data available for the selected filters."
                />
            </div>
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <span className={_cs(styles.legendDot, styles.legendConflict)} />
                    Conflict and violence
                </div>
                <div className={styles.legendItem}>
                    <span className={_cs(styles.legendDot, styles.legendDisaster)} />
                    Disasters
                </div>
            </div>
            <div className={styles.hint}>
                Bars aggregate all causes per country · click a row to zoom in on map.
            </div>
        </div>
    );
}

export default TopCountries;
