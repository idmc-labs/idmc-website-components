import React from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';

import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';

import styles from './styles.css';

export interface Props {
    className?: string;
    rank: number;
    countryName: string | undefined | null;
    conflict: number;
    disaster: number;
    total: number;
    maxTotal: number;
    onClick?: () => void;
    selected?: boolean;
}

function CountryBar(props: Props) {
    const {
        className,
        rank,
        countryName,
        conflict,
        disaster,
        total,
        maxTotal,
        onClick,
        selected,
    } = props;

    const conflictWidth = maxTotal > 0 ? (conflict / maxTotal) * 100 : 0;
    const disasterWidth = maxTotal > 0 ? (disaster / maxTotal) * 100 : 0;
    const clickable = isDefined(onClick);

    const rootClassName = _cs(
        styles.countryBar,
        clickable && styles.clickable,
        selected && styles.selected,
        className,
    );

    const content = (
        <>
            <div className={styles.rank}>
                {rank}
            </div>
            <div className={styles.name} title={countryName ?? undefined}>
                {countryName}
            </div>
            <div className={styles.track}>
                <div
                    className={styles.conflict}
                    style={{ width: `${conflictWidth}%` }}
                />
                <div
                    className={styles.disaster}
                    style={{ width: `${disasterWidth}%` }}
                />
            </div>
            <Numeral
                className={styles.total}
                value={total}
                abbreviate
            />
        </>
    );

    if (clickable) {
        return (
            <RawButton
                name={undefined}
                className={rootClassName}
                onClick={onClick}
            >
                {content}
            </RawButton>
        );
    }

    return (
        <div className={rootClassName}>
            {content}
        </div>
    );
}

export default CountryBar;
