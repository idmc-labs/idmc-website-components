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
    onCountrySelect: (iso3: string) => void;
    selectedIso3: string | undefined;
}

function TopCountries(props: Props) {
    const {
        className,
        idus,
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

    return (
        <div className={_cs(styles.topCountries, className)}>
            <div className={styles.heading}>
                Five countries reporting the highest internal displacements
            </div>
            <div className={styles.description}>
                {/* eslint-disable-next-line max-len */}
                This preliminary information is likely to change as more information becomes available.
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
        </div>
    );
}

export default TopCountries;
