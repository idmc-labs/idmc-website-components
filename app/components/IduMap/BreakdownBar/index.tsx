import React from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';

import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';

import { toSentenceCase } from '../EventListItem';

import styles from './styles.css';

export interface Props {
    className?: string;
    name: string;
    label: string | undefined | null;
    // Sizes the bar, so every row is measured on one scale.
    value: number;
    // Printed beside the bar when it differs from what the bar measures -- GIDD sizes from
    // raw figures and prints the API's rounded ones.
    displayValue?: number;
    maxValue: number;
    percent?: number;
    variant: 'conflict' | 'disaster';
    onClick?: (name: string) => void;
    selected?: boolean;
    abbreviate?: boolean;
}

function BreakdownBar(props: Props) {
    const {
        className,
        name,
        label,
        value,
        displayValue,
        maxValue,
        percent,
        variant,
        onClick,
        selected,
        abbreviate = true,
    } = props;

    const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const isConflict = variant === 'conflict';
    const percentDisplay = isDefined(percent) && percent < 1
        ? '<1%'
        : `${Math.round(percent ?? 0)}%`;
    const percentClassName = _cs(
        styles.percent,
        isConflict ? styles.conflictText : styles.disasterText,
    );
    const clickable = isDefined(onClick);

    const rootClassName = _cs(
        styles.breakdownBar,
        clickable && styles.clickable,
        selected && styles.selected,
        className,
    );

    const content = (
        <>
            <div className={styles.label} title={toSentenceCase(label) ?? undefined}>
                {toSentenceCase(label)}
            </div>
            <div className={styles.track}>
                <div
                    className={isConflict ? styles.conflictFill : styles.disasterFill}
                    style={{ width: `${barWidth}%` }}
                />
            </div>
            {isDefined(percent) && (
                <div className={percentClassName}>
                    {percentDisplay}
                </div>
            )}
            <Numeral
                className={styles.total}
                value={displayValue ?? value}
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

export default BreakdownBar;
