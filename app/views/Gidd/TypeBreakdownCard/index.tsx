import React, { useMemo, useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import { useQuery } from '@apollo/client';

import Header from '#components/Header';
import Message from '#components/Message';
import ListView from '#components/ListView';
import BreakdownBar from '#components/IduMap/BreakdownBar';
import { DATA_RELEASE } from '#utils/common';
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    GiddHazardBreakdownQuery,
    GiddViolenceBreakdownQuery,
} from '#generated/types';

import {
    bucketSmallValues,
    HAZARD_BREAKDOWN_QUERY,
    VIOLENCE_BREAKDOWN_QUERY,
    BreakdownQueryVariables,
    BucketedItem,
} from '../utils';

import styles from './styles.css';

type Variant = 'conflict' | 'disaster';
type Category = 'flow' | 'stock';

export interface Props {
    className?: string;
    variant: Variant;
    category: Category | undefined;
    countriesIso3: string[];
    startYear: number;
    endYear: number;
    clientCode: string;
    // e.g. "globally" / "in Sudan" — kept in sync with the other sidebar slides
    scopeLabel: string;
    abbreviate: boolean;
    selectedTypeId?: string;
    // every id selected in this variant's group narrows the breakdown list
    // (selectedTypeId alone only ever holds one id, even when several of this
    // variant's types are selected together)
    selectedTypeIds: string[];
    onTypeSelect?: (id: string) => void;
    // when a cause is selected, the opposite cause's card is treated as
    // having no data — the query is skipped and the list shows the empty state
    noData?: boolean;
}

function TypeBreakdownCard(props: Props) {
    const {
        className,
        variant,
        category,
        countriesIso3,
        startYear,
        endYear,
        clientCode,
        scopeLabel,
        abbreviate,
        selectedTypeId,
        selectedTypeIds,
        onTypeSelect,
        noData,
    } = props;

    const isStock = category === 'stock';
    const isConflict = variant === 'conflict';

    const variables = useMemo(() => ({
        countriesIso3,
        startYear,
        endYear,
        hazardTypes: isConflict ? undefined : selectedTypeIds,
        violenceSubTypes: isConflict ? selectedTypeIds : undefined,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [countriesIso3, startYear, endYear, isConflict, selectedTypeIds, clientCode]);

    const debouncedVariables = useDebouncedValue(variables);

    const {
        previousData: previousHazardData,
        data: hazardData = previousHazardData,
        loading: hazardLoading,
    } = useQuery<GiddHazardBreakdownQuery, BreakdownQueryVariables>(
        HAZARD_BREAKDOWN_QUERY,
        {
            variables: debouncedVariables,
            skip: isConflict || noData,
            context: {
                clientName: 'helix',
            },
        },
    );

    const {
        previousData: previousViolenceData,
        data: violenceData = previousViolenceData,
        loading: violenceLoading,
    } = useQuery<GiddViolenceBreakdownQuery, BreakdownQueryVariables>(
        VIOLENCE_BREAKDOWN_QUERY,
        {
            variables: debouncedVariables,
            skip: !isConflict || noData,
            context: {
                clientName: 'helix',
            },
        },
    );

    const entries = isConflict
        ? violenceData?.giddPublicConflictStatistics?.displacementsByViolenceSubType
        : hazardData?.giddPublicDisasterStatistics?.displacementsByHazardType;
    const data = isConflict ? violenceData : hazardData;
    const loading = isConflict ? violenceLoading : hazardLoading;
    const pending = loading && !data;

    // Types with no displacement for the current filters are dropped rather
    // than shown as empty rows; the long tail below 1% collapses into "Other".
    // Both are recomputed per metric, so the row set legitimately differs
    // between the flow and stock variants of this card. Once one or more
    // types are selected, the list narrows to just those — selecting a
    // type is a filter, not just a highlight — enforced client-side too
    // since it's not guaranteed the API's own hazardTypes/violenceSubTypes
    // args narrow the breakdown list itself rather than just the totals.
    const rows = useMemo(() => {
        if (noData) {
            return [];
        }
        const selectedIds = new Set(selectedTypeIds);
        const scopedEntries = selectedIds.size > 0
            ? (entries ?? []).filter((entry) => selectedIds.has(entry.id))
            : (entries ?? []);
        const values = scopedEntries
            .map((entry) => ({
                id: entry.id,
                name: entry.label,
                value: (isStock
                    ? entry.totalDisplacements
                    : entry.newDisplacements) ?? 0,
            }))
            .filter((entry) => entry.value > 0)
            .sort((a, b) => b.value - a.value);

        return bucketSmallValues(values);
    }, [entries, isStock, selectedTypeIds, noData]);

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
    const yearRangeLabel = startYear === endYear ? `${endYear}` : `${startYear}-${endYear}`;
    const timeLabel = isStock ? `at the end of ${endYear}` : `in ${yearRangeLabel}`;
    const description = `${metricLabel} by ${causeLabel}, breakdown by `
        + `${breakdownLabel} · ${timeLabel} ${scopeLabel}.`;

    const rowKeySelector = useCallback((row: BucketedItem) => row.id, []);
    const rowRendererParams = useCallback((_: string, row: BucketedItem) => ({
        name: row.id,
        label: row.name,
        value: row.value,
        maxValue,
        variant,
        abbreviate,
        selected: row.id === selectedTypeId,
        onClick: onTypeSelect,
    }), [maxValue, variant, abbreviate, selectedTypeId, onTypeSelect]);

    return (
        <div className={_cs(styles.typeBreakdownCard, className)}>
            <Header
                heading={heading}
                headingClassName={styles.slideHeading}
                headingSize="small"
                headingDescription={description}
                headingDescriptionClassName={styles.description}
            />
            {pending ? (
                <Message pending compact />
            ) : (
                <ListView
                    className={styles.list}
                    data={rows}
                    keySelector={rowKeySelector}
                    renderer={BreakdownBar}
                    rendererParams={rowRendererParams}
                    pending={false}
                    errored={false}
                    filtered={false}
                    messageShown
                    emptyMessage="No data available for the selected filters."
                />
            )}
        </div>
    );
}

export default TypeBreakdownCard;
