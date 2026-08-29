import React, { useMemo, useCallback, useState } from 'react';
import {
    _cs,
    formatDateToString,
    decodeDate,
} from '@togglecorp/fujs';

import ListView from '#components/ListView';
import RawButton from '#components/RawButton';
import { IduDataQuery } from '#generated/types';

import EventListItem, { Props as EventListItemProps } from '../EventListItem';

import styles from './styles.css';

type IduRow = NonNullable<IduDataQuery['idu']>[number];

const PAGE_SIZE = 10;

const formatDate = (date: string | undefined | null) => (
    date ? formatDateToString(decodeDate(date), 'dd MMM yyyy') : ''
);

function getTimestamp(idu: IduRow): number {
    const d = idu.displacement_end_date ?? idu.displacement_date ?? idu.displacement_start_date;
    return d ? new Date(d).getTime() : 0;
}

const keySelector = (item: IduRow) => String(item.id);

interface Props {
    className?: string;
    idus: IduRow[] | undefined;
    startDate: string | undefined;
    endDate: string | undefined;
    scopeLabel: string;
    filterSuffix: string;
    onRecordSelect?: (recordId: number) => void;
    selectedRecordId: number | undefined;
    expandable?: boolean;
    abbreviate?: boolean;
}

function RecentEvents(props: Props) {
    const {
        className,
        idus,
        startDate,
        endDate,
        scopeLabel,
        filterSuffix,
        onRecordSelect,
        selectedRecordId,
        expandable,
        abbreviate = true,
    } = props;

    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [expandedId, setExpandedId] = useState<number | undefined>();

    const handleExpandToggle = useCallback((id: number) => {
        setExpandedId((prev) => (prev === id ? undefined : id));
    }, []);

    const sorted = useMemo<IduRow[]>(() => (
        [...(idus ?? [])].sort((a, b) => getTimestamp(b) - getTimestamp(a))
    ), [idus]);

    const rendererParams = useCallback((_: string, item: IduRow): EventListItemProps => {
        const startDateStr = formatDate(item.displacement_start_date);
        const endDateStr = formatDate(item.displacement_end_date);
        const dateRange = [startDateStr, endDateStr].filter(Boolean).join(' – ');

        if (expandable) {
            const isExpanded = expandedId === item.id;
            return {
                name: item.id,
                title: item.event_name ?? item.country,
                subtitle: dateRange || undefined,
                displacementType: item.displacement_type,
                value: item.figure,
                onClick: handleExpandToggle,
                selected: isExpanded,
                expanded: isExpanded,
                excerpt: item.standard_popup_text,
                source: item.sources,
                date: item.displacement_date,
                abbreviate,
            };
        }

        return {
            name: item.id,
            title: item.event_name ?? item.country,
            subtitle: dateRange || undefined,
            displacementType: item.displacement_type,
            value: item.figure,
            onClick: onRecordSelect,
            selected: item.id === selectedRecordId,
            abbreviate,
        };
    }, [expandable, expandedId, handleExpandToggle, onRecordSelect, selectedRecordId, abbreviate]);

    const handleShowMore = useCallback(() => {
        setVisibleCount((count) => count + PAGE_SIZE);
    }, []);

    const visible = useMemo(
        () => sorted.slice(0, visibleCount),
        [sorted, visibleCount],
    );
    const hasMore = visibleCount < sorted.length;

    const description = `Preliminary estimates of internal displacements ${scopeLabel} from ${formatDate(startDate)} – ${formatDate(endDate)}.${filterSuffix}`;

    return (
        <div className={_cs(styles.recentEvents, className)}>
            <div className={styles.heading}>
                Most recent recorded movements
            </div>
            <div className={styles.description}>
                {description}
            </div>
            <div className={styles.list}>
                <ListView
                    data={visible}
                    keySelector={keySelector}
                    renderer={EventListItem}
                    rendererParams={rendererParams}
                    direction="vertical"
                    errored={false}
                    pending={false}
                    filtered={false}
                    messageShown
                    emptyMessage="No data available for the selected filters."
                />
                {hasMore && (
                    <RawButton
                        name={undefined}
                        className={styles.showMore}
                        onClick={handleShowMore}
                    >
                        Show more
                    </RawButton>
                )}
            </div>
            <div className={styles.hint}>
                {expandable
                    ? 'Tap a row to see the event details.'
                    : 'Click a row to pin the event on the map.'}
            </div>
        </div>
    );
}

export default RecentEvents;
