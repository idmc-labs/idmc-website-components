import React, { useMemo } from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';
import { useQuery } from '@apollo/client';

import Header from '#components/Header';
import Message from '#components/Message';
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

    const variables = useMemo(() => ({
        countriesIso3,
        startYear,
        endYear,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [countriesIso3, startYear, endYear, clientCode]);

    const debouncedVariables = useDebouncedValue(variables);

    const {
        previousData: previousHazardData,
        data: hazardData = previousHazardData,
        loading: hazardLoading,
    } = useQuery<GiddHazardBreakdownQuery, BreakdownQueryVariables>(
        HAZARD_BREAKDOWN_QUERY,
        {
            variables: debouncedVariables,
            skip: isConflict,
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
            skip: !isConflict,
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
    // between the flow and stock variants of this card.
    const rows = useMemo(() => {
        const values = (entries ?? [])
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
    }, [entries, isStock]);

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
                headingSize="small"
                headingDescription={description}
                headingDescriptionClassName={styles.description}
            />
            {pending ? (
                <Message pending compact />
            ) : (
                <>
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
                </>
            )}
        </div>
    );
}

export default TypeBreakdownCard;
