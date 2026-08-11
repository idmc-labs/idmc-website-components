import React, { useMemo } from 'react';
import {
    _cs,
    isTruthyString,
    listToGroupList,
    mapToList,
    sum,
    compareNumber,
} from '@togglecorp/fujs';

import { IduDataQuery } from '#generated/types';

import BreakdownBar from '../BreakdownBar';

import styles from './styles.css';

type IduRow = NonNullable<IduDataQuery['idu']>[number];

// FIXME: the conflict type is not a structured field, so we parse it out of the
// event name (fragile, depends on the "<country>: <type> - <location> - <date>"
// format). Update the API to expose the conflict type as a field and read that
// instead.
//   "Iran: International armed conflict (IAC) - Countrywide - 28/02/2026"
//    -> "International armed conflict (IAC)"
function getConflictType(eventName: string | undefined | null) {
    if (!eventName) {
        return undefined;
    }
    const afterCountry = eventName.split(': ').slice(1).join(': ');
    const conflictType = afterCountry.split(' - ')[0]?.trim();
    return isTruthyString(conflictType) ? conflictType : undefined;
}

interface ConflictDatum {
    key: string;
    label: string | undefined;
    total: number;
}

interface Props {
    className?: string;
    idus: IduRow[] | undefined;
}

function ConflictBreakdown(props: Props) {
    const {
        className,
        idus,
    } = props;

    const conflictTypes = useMemo<ConflictDatum[]>(() => {
        const conflicts = (idus ?? []).filter((d) => (
            d.displacement_type === 'Conflict'
            && isTruthyString(getConflictType(d.event_name))
        ));
        const grouped = listToGroupList(conflicts, (d) => getConflictType(d.event_name) ?? '');
        const list = mapToList(grouped, (items) => {
            const conflictType = getConflictType(items[0].event_name);
            return {
                key: conflictType ?? '',
                label: conflictType,
                total: sum(items.map((item) => item.figure)),
            };
        });

        return [...list]
            .filter((item) => item.total > 0)
            .sort((a, b) => compareNumber(a.total, b.total, -1));
    }, [idus]);

    const grandTotal = sum(conflictTypes.map((item) => item.total));
    const maxTotal = conflictTypes[0]?.total ?? 0;

    return (
        <div className={_cs(styles.conflictBreakdown, className)}>
            <div className={styles.heading}>
                Internal displacements by conflict and violence
            </div>
            <div className={styles.description}>
                Breakdown by type of conflict or violence.
            </div>
            <div className={styles.list}>
                {conflictTypes.map((item) => (
                    <BreakdownBar
                        key={item.key}
                        label={item.label}
                        value={item.total}
                        maxValue={maxTotal}
                        percent={grandTotal > 0 ? (item.total / grandTotal) * 100 : 0}
                        variant="conflict"
                    />
                ))}
            </div>
        </div>
    );
}

export default ConflictBreakdown;
