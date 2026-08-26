import React, { useMemo, useCallback } from 'react';
import {
    _cs,
    isTruthyString,
    listToGroupList,
    mapToList,
    sum,
    compareNumber,
} from '@togglecorp/fujs';

import ListView from '#components/ListView';
import { IduDataQuery } from '#generated/types';

import BreakdownBar, { Props as BreakdownBarProps } from '../BreakdownBar';

import styles from './styles.css';

type IduRow = NonNullable<IduDataQuery['idu']>[number];

type Variant = 'disaster' | 'conflict';

interface BreakdownDatum {
    key: string;
    label: string | undefined | null;
    total: number;
}

const keySelector = (item: BreakdownDatum) => item.key;

const variantConfig: {
    [key in Variant]: {
        displacementType: 'Disaster' | 'Conflict';
        groupSelector: (datum: IduRow) => string | undefined | null;
    };
} = {
    disaster: {
        displacementType: 'Disaster',
        groupSelector: (datum) => datum.type,
    },
    conflict: {
        displacementType: 'Conflict',
        groupSelector: (datum) => datum.subtype,
    },
};

interface Props {
    className?: string;
    idus: IduRow[] | undefined;
    variant: Variant;
    heading: string;
    description: string;
    // pass to make rows clickable (selects the group as a trigger-type filter)
    onTriggerSelect?: (triggerType: string) => void;
    selectedTriggerType?: string;
}

function Breakdown(props: Props) {
    const {
        className,
        idus,
        variant,
        heading,
        description,
        onTriggerSelect,
        selectedTriggerType,
    } = props;

    const { displacementType, groupSelector } = variantConfig[variant];

    const items = useMemo<BreakdownDatum[]>(() => {
        const filtered = (idus ?? []).filter((d) => (
            d.displacement_type === displacementType
            && isTruthyString(groupSelector(d))
        ));
        const grouped = listToGroupList(filtered, (d) => groupSelector(d) ?? '');
        const list = mapToList(grouped, (groupItems) => {
            const label = groupSelector(groupItems[0]);
            return {
                key: label ?? '',
                label,
                total: sum(groupItems.map((item) => item.figure)),
            };
        });

        return [...list]
            .filter((item) => item.total > 0)
            .sort((a, b) => compareNumber(a.total, b.total, -1));
    }, [idus, displacementType, groupSelector]);

    const maxTotal = items[0]?.total ?? 0;

    const rendererParams = useCallback((
        _: string,
        item: BreakdownDatum,
    ): BreakdownBarProps => ({
        name: item.key,
        label: item.label,
        value: item.total,
        maxValue: maxTotal,
        variant,
        onClick: item.key ? onTriggerSelect : undefined,
        selected: item.key === selectedTriggerType,
    }), [maxTotal, variant, onTriggerSelect, selectedTriggerType]);

    return (
        <div className={_cs(styles.breakdown, className)}>
            <div className={styles.heading}>
                {heading}
            </div>
            <div className={styles.description}>
                {description}
            </div>
            <ListView
                className={styles.list}
                data={items}
                keySelector={keySelector}
                renderer={BreakdownBar}
                rendererParams={rendererParams}
                errored={false}
                pending={false}
                filtered={false}
                messageShown
                emptyMessage="No data available for the selected filters."
            />
            <div className={styles.hint}>
                Preliminary · unvalidated reports from the selected timeframe.
            </div>
        </div>
    );
}

export default Breakdown;
