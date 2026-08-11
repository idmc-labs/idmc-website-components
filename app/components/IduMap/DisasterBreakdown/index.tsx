import React, { useMemo } from 'react';
import {
    _cs,
    isDefined,
    listToGroupList,
    mapToList,
    sum,
    compareNumber,
} from '@togglecorp/fujs';

import { IduDataQuery } from '#generated/types';

import BreakdownBar from '../BreakdownBar';

import styles from './styles.css';

type IduRow = NonNullable<IduDataQuery['idu']>[number];

interface HazardDatum {
    key: string;
    label: string | undefined | null;
    total: number;
}

interface Props {
    className?: string;
    idus: IduRow[] | undefined;
    onTriggerSelect: (triggerType: string) => void;
    selectedTriggerType: string | undefined;
}

function DisasterBreakdown(props: Props) {
    const {
        className,
        idus,
        onTriggerSelect,
        selectedTriggerType,
    } = props;

    const hazards = useMemo<HazardDatum[]>(() => {
        const disasters = (idus ?? []).filter((d) => (
            d.displacement_type === 'Disaster' && isDefined(d.type)
        ));
        const grouped = listToGroupList(disasters, (d) => d.type ?? '');
        const list = mapToList(grouped, (items) => {
            const first = items[0];
            return {
                key: first.type ?? '',
                label: first.type,
                total: sum(items.map((item) => item.figure)),
            };
        });

        return [...list]
            .filter((hazard) => hazard.total > 0)
            .sort((a, b) => compareNumber(a.total, b.total, -1));
    }, [idus]);

    const grandTotal = sum(hazards.map((hazard) => hazard.total));
    const maxTotal = hazards[0]?.total ?? 0;

    return (
        <div className={_cs(styles.disasterBreakdown, className)}>
            <div className={styles.heading}>
                Internal displacements by disasters
            </div>
            <div className={styles.description}>
                Breakdown by hazard type.
            </div>
            <div className={styles.list}>
                {hazards.map((hazard) => {
                    const handleClick = hazard.key
                        ? () => onTriggerSelect(hazard.key)
                        : undefined;
                    return (
                        <BreakdownBar
                            key={hazard.key}
                            label={hazard.label}
                            value={hazard.total}
                            maxValue={maxTotal}
                            percent={grandTotal > 0 ? (hazard.total / grandTotal) * 100 : 0}
                            variant="disaster"
                            onClick={handleClick}
                            selected={hazard.key === selectedTriggerType}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default DisasterBreakdown;
