import React, { useMemo, useCallback, useState } from 'react';
import {
    _cs,
    isDefined,
    listToGroupList,
    mapToList,
    sum,
    compareNumber,
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

const formatDate = (date: string | undefined) => (
    date ? formatDateToString(decodeDate(date), 'dd MMM yyyy') : ''
);

function displacementTerm(cause: 'all' | 'Conflict' | 'Disaster'): string {
    if (cause === 'Disaster') return 'disaster';
    if (cause === 'Conflict') return 'conflict and violence';
    return 'internal';
}

interface RecentEvent {
    key: string;
    id: number | undefined | null;
    title: string | undefined | null;
    code: string | undefined | null;
    displacementType: IduRow['displacement_type'];
    total: number;
    latestTime: number;
    description: string | undefined | null;
    source: string | undefined | null;
    date: string | undefined | null;
}

const eventKeySelector = (item: RecentEvent) => item.key;

interface Props {
    className?: string;
    idus: IduRow[] | undefined;
    cause: 'all' | 'Conflict' | 'Disaster';
    startDate: string | undefined;
    endDate: string | undefined;
    // omitted (e.g. on desktop uses the map) to make rows non-clickable
    onEventSelect?: (eventId: number, eventName: string) => void;
    selectedEventId: number | undefined;
    // on mobile (no map) a row click expands its excerpt + source inline instead
    expandable?: boolean;
}

function RecentEvents(props: Props) {
    const {
        className,
        idus,
        cause,
        startDate,
        endDate,
        onEventSelect,
        selectedEventId,
        expandable,
    } = props;

    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [expandedKey, setExpandedKey] = useState<string | undefined>();

    const events = useMemo<RecentEvent[]>(() => {
        const grouped = listToGroupList(idus ?? [], (d) => d.event_id ?? -1);
        const list = mapToList(grouped, (items) => {
            const first = items[0];
            const latestTime = Math.max(
                ...items.map((item) => (
                    item.displacement_date ? new Date(item.displacement_date).getTime() : 0
                )),
            );
            return {
                key: String(first.event_id),
                id: first.event_id,
                title: first.event_name,
                code: first.event_codes,
                displacementType: first.displacement_type,
                total: sum(items.map((item) => item.figure)),
                latestTime,
                description: first.standard_popup_text,
                source: first.sources,
                date: first.displacement_date,
            };
        });

        return [...list].sort((a, b) => compareNumber(a.latestTime, b.latestTime, -1));
    }, [idus]);

    const rendererParams = useCallback((key: string, item: RecentEvent): EventListItemProps => {
        const { id, title } = item;

        if (expandable) {
            const isExpanded = expandedKey === key;
            return {
                title,
                subtitle: item.code,
                subtitleMonospace: true,
                displacementType: item.displacementType,
                value: item.total,
                onClick: () => setExpandedKey((prev) => (prev === key ? undefined : key)),
                selected: isExpanded,
                expanded: isExpanded,
                excerpt: item.description,
                source: item.source,
                date: item.date,
            };
        }

        return {
            title,
            subtitle: item.code,
            subtitleMonospace: true,
            displacementType: item.displacementType,
            value: item.total,
            onClick: onEventSelect && isDefined(id) && isDefined(title)
                ? () => onEventSelect(id, title)
                : undefined,
            selected: isDefined(selectedEventId) && id === selectedEventId,
        };
    }, [expandable, expandedKey, onEventSelect, selectedEventId]);

    const handleShowMore = useCallback(() => {
        setVisibleCount((count) => count + PAGE_SIZE);
    }, []);

    const visibleEvents = useMemo(
        () => events.slice(0, visibleCount),
        [events, visibleCount],
    );
    const hasMore = visibleCount < events.length;

    return (
        <div className={_cs(styles.recentEvents, className)}>
            <div className={styles.heading}>
                The most recent recorded events
            </div>
            <div className={styles.description}>
                {`Preliminary estimates of ${displacementTerm(cause)} displacement events from ${formatDate(startDate)} – ${formatDate(endDate)}.`}
            </div>
            <div className={styles.list}>
                {events.length === 0 ? (
                    <div className={styles.noData}>
                        No data available for the selected filters.
                    </div>
                ) : (
                    <ListView
                        data={visibleEvents}
                        keySelector={eventKeySelector}
                        renderer={EventListItem}
                        rendererParams={rendererParams}
                        direction="vertical"
                        errored={false}
                        pending={false}
                        filtered={false}
                    />
                )}
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
            {expandable && (
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <span className={_cs(styles.legendDot, styles.legendConflict)} />
                        Conflict and violence
                    </div>
                    <div className={styles.legendItem}>
                        <span className={_cs(styles.legendDot, styles.legendDisaster)} />
                        Disasters
                    </div>
                </div>
            )}
        </div>
    );
}

export default RecentEvents;
