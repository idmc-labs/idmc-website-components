import React from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';

import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';

import { toSentenceCase } from '../EventListItem';

import styles from './styles.css';

export interface Props {
    className?: string;
    label: string | undefined | null;
    value: number;
    maxValue: number;
    variant: 'conflict' | 'disaster';
    onClick?: () => void;
    selected?: boolean;
    abbreviate?: boolean;
}

function BreakdownBar(props: Props) {
    const {
        className,
        label,
        value,
        maxValue,
        variant,
        onClick,
        selected,
        abbreviate = true,
    } = props;

    const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const isConflict = variant === 'conflict';
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
            <Numeral
                className={styles.total}
                value={value}
                abbreviate={abbreviate}
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
