import React, { useMemo } from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';
import { useQuery } from '@apollo/client';

import Header from '#components/Header';
import BreakdownBar from '#components/IduMap/BreakdownBar';
import { DATA_RELEASE } from '#utils/common';
import useDebouncedValue from '#hooks/useDebouncedValue';

import {
    bucketSmallValues,
    buildBreakdownQuery,
    BreakdownQueryResult,
    BreakdownQueryVariables,
    TypeOption,
} from '../utils';

import styles from './styles.css';

export type { TypeOption } from '../utils';

type Variant = 'conflict' | 'disaster';
type Category = 'flow' | 'stock';

export interface Props {
    className?: string;
    variant: Variant;
    category: Category | undefined;
    // the full option list to break down by: hazard types, or violence sub-types
    types: TypeOption[];
    countriesIso3: string[];
    startYear: number;
    endYear: number;
    clientCode: string;
    // e.g. "globally" / "in Sudan" — keeps the subtitle honest about the filters
    scopeLabel: string;
    abbreviate: boolean;
    selectedTypeId?: string;
    onTypeSelect?: (id: string) => void;
}

function TypeBreakdownCard(props: Props) {
    const {
        className,
        variant,
        category,
        types,
        countriesIso3,
        startYear,
        endYear,
        clientCode,
        scopeLabel,
        abbreviate,
        selectedTypeId,
        onTypeSelect,
    } = props;

    const isStock = category === 'stock';
    const isConflict = variant === 'conflict';

    const query = useMemo(
        () => buildBreakdownQuery(variant, types),
        [variant, types],
    );

    const variables = useMemo(() => ({
        countriesIso3,
        startYear,
        endYear,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [countriesIso3, startYear, endYear, clientCode]);

    const debouncedVariables = useDebouncedValue(variables);

    const {
        previousData,
        data = previousData,
    } = useQuery<BreakdownQueryResult, BreakdownQueryVariables>(
        query,
        {
            variables: debouncedVariables,
            skip: types.length === 0,
            context: {
                clientName: 'helix',
            },
        },
    );

    // Types with no displacement for the current filters are dropped rather
    // than shown as empty rows; the long tail below 1% collapses into "Other".
    // Both are recomputed per metric, so the row set legitimately differs
    // between the flow and stock variants of this card.
    const rows = useMemo(() => {
        if (!data) {
            return [];
        }
        const values = types
            .map((type) => {
                const stats = data[`t${type.id}`];
                const value = (isStock
                    ? stats?.totalDisplacements
                    : stats?.newDisplacements) ?? 0;
                return { ...type, value };
            })
            .filter((type) => type.value > 0)
            .sort((a, b) => b.value - a.value);

        return bucketSmallValues(values);
    }, [data, types, isStock]);

    // after bucketing — "Other" can outrank the row above it
    const maxValue = Math.max(0, ...rows.map((row) => row.value));

    let heading: string;
    if (isConflict) {
        heading = isStock ? 'IDPs from conflict by type' : 'Conflict displacement by type';
    } else {
        heading = isStock ? 'IDPs from disasters by hazard' : 'Disaster displacement by hazard';
    }

    const metricLabel = isStock ? 'IDPs' : 'Internal displacements';
    const causeLabel = isConflict ? 'conflict and violence' : 'disasters';
    const breakdownLabel = isConflict ? 'type' : 'hazard';
    const timeLabel = isStock ? `at the end of ${endYear}` : `in ${endYear}`;
    const description = `${metricLabel} by ${causeLabel}, breakdown by `
        + `${breakdownLabel} · ${timeLabel} ${scopeLabel}.`;

    const footer = isConflict
        ? "Values follow IDMC's violence sub-type taxonomy."
        : 'Hazard breakdown from the disaggregated GIDD extract.';

    return (
        <div className={_cs(styles.typeBreakdownCard, className)}>
            <Header
                heading={heading}
                headingSize="medium"
                headingDescription={description}
            />
            <div className={styles.list}>
                {rows.map((row) => (
                    <BreakdownBar
                        key={row.id}
                        label={row.name}
                        value={row.value}
                        maxValue={maxValue}
                        variant={variant}
                        abbreviate={abbreviate}
                        selected={row.id === selectedTypeId}
                        onClick={isDefined(onTypeSelect) && !row.isOther
                            ? () => onTypeSelect(row.id)
                            : undefined}
                    />
                ))}
            </div>
            <div className={styles.footer}>
                {footer}
            </div>
        </div>
    );
}

export default TypeBreakdownCard;
