import React, { useMemo, useCallback } from 'react';
import {
    _cs,
    compareNumber,
    sum,
    listToGroupList,
    mapToList,
    formatDateToString,
    decodeDate,
} from '@togglecorp/fujs';

import ListView from '#components/ListView';
import { IduDataQuery } from '#generated/types';

import EventListItem, { Props as EventListItemProps } from '../EventListItem';

import styles from './styles.css';

type IduRow = NonNullable<IduDataQuery['idu']>[number];

const MAX_EVENTS = 5;

const formatDate = (date: string | undefined) => (
    date ? formatDateToString(decodeDate(date), 'dd MMM yyyy') : ''
);

function displacementTerm(cause: 'all' | 'Conflict' | 'Disaster'): string {
    if (cause === 'Disaster') return 'disaster';
    if (cause === 'Conflict') return 'conflict and violence';
    return 'internal';
}

interface LargestEvent {
    key: string;
    eventId: number;
    eventName: string | undefined | null;
    country: string | undefined | null;
    displacementType: IduRow['displacement_type'];
    value: number;
}

const keySelector = (item: LargestEvent) => item.key;

interface Props {
    className?: string;
    idus: IduRow[] | undefined;
    cause: 'all' | 'Conflict' | 'Disaster';
    startDate: string | undefined;
    endDate: string | undefined;
    scopeLabel: string;
    filterSuffix: string;
    onEventSelect?: (eventId: number) => void;
    selectedEventId: number | undefined;
}

function LargestEvents(props: Props) {
    const {
        className,
        idus,
        cause,
        startDate,
        endDate,
        scopeLabel,
        filterSuffix,
        onEventSelect,
        selectedEventId,
    } = props;

    const events = useMemo<LargestEvent[]>(() => {
        const grouped = listToGroupList(idus ?? [], (d) => d.event_id ?? -1);
        const list = mapToList(grouped, (items) => {
            const first = items[0];
            return {
                key: String(first.event_id),
                eventId: first.event_id ?? -1,
                eventName: first.event_name,
                country: first.country,
                displacementType: first.displacement_type,
                value: sum(items.map((d) => d.figure)),
            };
        });
        return [...list]
            .filter((e) => e.value > 0)
            .sort((a, b) => compareNumber(a.value, b.value, -1))
            .slice(0, MAX_EVENTS);
    }, [idus]);

    const rendererParams = useCallback((
        _: string,
        event: LargestEvent,
    ): EventListItemProps => ({
        name: event.eventId,
        title: event.eventName ?? event.country,
        subtitle: undefined,
        displacementType: event.displacementType,
        value: event.value,
        onClick: onEventSelect,
        selected: event.eventId === selectedEventId,
    }), [onEventSelect, selectedEventId]);

    const description = `Preliminary estimates of the largest ${displacementTerm(cause)} displacements reported ${scopeLabel} between ${formatDate(startDate)} - ${formatDate(endDate)}.${filterSuffix}`;

    return (
        <div className={_cs(styles.largestEvents, className)}>
            <div className={styles.heading}>
                Largest displacement events
            </div>
            <div className={styles.description}>
                {description}
            </div>
            <ListView
                className={styles.list}
                data={events}
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
            <div className={styles.hint}>
                Click a row to pin the event on the map.
            </div>
        </div>
    );
}

export default LargestEvents;
