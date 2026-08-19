import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Header from '#components/Header';
import NumberBlock from '#components/NumberBlock';
import BreakdownBar from '#components/IduMap/BreakdownBar';

import { BucketedItem } from '../utils';

import styles from './styles.css';

export interface Props {
    className?: string;
    sortedHazards: BucketedItem[];
    maxDisplacementValue: number | undefined;
    grandTotal: number;
    totalEvents: number | undefined;
    selectedTriggerType: string | undefined;
    onHazardSelect: (triggerType: string) => void;
    abbreviate: boolean;
}

function HazardBreakdownCard(props: Props) {
    const {
        className,
        sortedHazards,
        maxDisplacementValue,
        grandTotal,
        totalEvents,
        selectedTriggerType,
        onHazardSelect,
        abbreviate,
    } = props;

    return (
        <div className={_cs(styles.hazardBreakdownCard, className)}>
            <Header
                heading="Breakdown by hazard type"
                headingSize="medium"
            />
            <NumberBlock
                label=""
                size="medium"
                variant="disaster"
                subLabel="Disaster Events Reported"
                value={totalEvents}
                abbreviated={abbreviate}
            />
            <div className={styles.list}>
                {sortedHazards.map((hazard) => (
                    <BreakdownBar
                        key={hazard.id}
                        label={hazard.name}
                        value={hazard.value}
                        maxValue={maxDisplacementValue ?? 0}
                        percent={grandTotal > 0
                            ? (hazard.value / grandTotal) * 100
                            : 0}
                        variant="disaster"
                        abbreviate={abbreviate}
                        selected={hazard.id === selectedTriggerType}
                        // "Other" aggregates several hazard types, so there is
                        // no single trigger type to filter by
                        onClick={hazard.isOther
                            ? undefined
                            : () => onHazardSelect(hazard.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default HazardBreakdownCard;
