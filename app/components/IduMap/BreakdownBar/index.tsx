import React from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';

import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';

import styles from './styles.css';

export interface Props {
    className?: string;
    label: string | undefined | null;
    value: number;
    maxValue: number;
    percent: number;
    variant: 'conflict' | 'disaster';
    onClick?: () => void;
    selected?: boolean;
}

function BreakdownBar(props: Props) {
    const {
        className,
        label,
        value,
        maxValue,
        percent,
        variant,
        onClick,
        selected,
    } = props;

    const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const isConflict = variant === 'conflict';
    const percentDisplay = percent < 1 ? '<1%' : `${Math.round(percent)}%`;
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
            <div className={styles.label}>
                {label}
            </div>
            <div className={styles.track}>
                <div
                    className={isConflict ? styles.conflictFill : styles.disasterFill}
                    style={{ width: `${barWidth}%` }}
                />
            </div>
            <div className={percentClassName}>
                {percentDisplay}
            </div>
            <Numeral
                className={styles.total}
                value={value}
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

export default BreakdownBar;
