import React from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';

import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';
import { roundAndRemoveZero } from '#utils/common';

import styles from './styles.css';

export interface Props {
    className?: string;
    name: string;
    rank: number;
    countryName: string | undefined | null;
    conflict: number;
    disaster: number;
    total: number;
    maxTotal: number;
    onClick?: (name: string) => void;
    selected?: boolean;
    abbreviate?: boolean;
    showBreakdown?: boolean;
}

function CountryBar(props: Props) {
    const {
        className,
        name,
        rank,
        countryName,
        conflict,
        disaster,
        total,
        maxTotal,
        onClick,
        selected,
        abbreviate = true,
        showBreakdown = false,
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
            <div className={styles.trackWrapper}>
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
                {showBreakdown && (
                    <div className={styles.breakdown} role="tooltip">
                        <div className={styles.breakdownItem}>
                            <span className={_cs(styles.breakdownDot, styles.conflict)} />
                            <span className={styles.breakdownLabel}>
                                Conflict and violence
                            </span>
                            <Numeral
                                className={styles.breakdownValue}
                                value={roundAndRemoveZero(conflict) ?? 0}
                                abbreviate={abbreviate}
                            />
                        </div>
                        <div className={styles.breakdownItem}>
                            <span className={_cs(styles.breakdownDot, styles.disaster)} />
                            <span className={styles.breakdownLabel}>
                                Disasters
                            </span>
                            <Numeral
                                className={styles.breakdownValue}
                                value={roundAndRemoveZero(disaster) ?? 0}
                                abbreviate={abbreviate}
                            />
                        </div>
                    </div>
                )}
            </div>
            <Numeral
                className={styles.total}
                value={total}
                abbreviate={abbreviate}
            />
        </>
    );

    if (clickable) {
        return (
            <RawButton
                name={name}
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
