import React, { useMemo } from 'react';
import {
    _cs,
    listToGroupList,
    mapToList,
    sum,
    compareNumber,
} from '@togglecorp/fujs';

import { IduDataQuery } from '#generated/types';

import CountryBar from './CountryBar';

import styles from './styles.css';

type IduRow = NonNullable<IduDataQuery['idu']>[number];

const MAX_COUNTRIES = 5;

function formatDate(date: string | undefined) {
    if (!date) {
        return '';
    }
    return new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

interface CountryDatum {
    key: string;
    countryName: string | undefined | null;
    conflict: number;
    disaster: number;
    total: number;
}

interface Props {
    className?: string;
    idus: IduRow[] | undefined;
    startDate: string | undefined;
    endDate: string | undefined;
    onCountrySelect: (iso3: string) => void;
    selectedIso3: string | undefined;
}

function TopCountries(props: Props) {
    const {
        className,
        idus,
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

    const description = `Between ${formatDate(startDate)} and ${formatDate(endDate)}, IDMC recorded the highest numbers of internal displacements in the following countries.`;

    return (
        <div className={_cs(styles.topCountries, className)}>
            <div className={styles.heading}>
                Countries with the highest numbers of internal displacements
            </div>
            <div className={styles.description}>
                {description}
            </div>
            <div className={styles.list}>
                {countries.map((country, index) => {
                    const handleClick = country.key
                        ? () => onCountrySelect(country.key)
                        : undefined;
                    return (
                        <CountryBar
                            key={country.key}
                            rank={index + 1}
                            countryName={country.countryName}
                            conflict={country.conflict}
                            disaster={country.disaster}
                            total={country.total}
                            maxTotal={maxTotal}
                            onClick={handleClick}
                            selected={country.key === selectedIso3}
                        />
                    );
                })}
            </div>
            <div className={styles.hint}>
                Bars aggregate all causes per country · click a row to focus it on the map.
            </div>
        </div>
    );
}

export default TopCountries;
