import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Header from '#components/Header';
import NumberBlock from '#components/NumberBlock';
import BreakdownBar from '#components/IduMap/BreakdownBar';
import { getHazardTypeLabel } from '#utils/common';
import { GiddStatisticsQuery } from '#generated/types';

import styles from './styles.css';

type HazardData = NonNullable<NonNullable<GiddStatisticsQuery['giddPublicDisasterStatistics']>['displacementsByHazardType']>[number];

export interface Props {
    className?: string;
    sortedHazards: HazardData[];
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
                        label={getHazardTypeLabel(hazard)}
                        value={hazard.newDisplacementsRounded ?? 0}
                        maxValue={maxDisplacementValue ?? 0}
                        percent={grandTotal > 0
                            ? ((hazard.newDisplacementsRounded ?? 0) / grandTotal) * 100
                            : 0}
                        variant="disaster"
                        abbreviate={abbreviate}
                        selected={hazard.id === selectedTriggerType}
                        onClick={() => onHazardSelect(hazard.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default HazardBreakdownCard;
