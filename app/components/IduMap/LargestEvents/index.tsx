import React, { useMemo, useCallback } from 'react';
import {
    _cs,
    isDefined,
    isTruthyString,
    compareNumber,
} from '@togglecorp/fujs';

import ListView from '#components/ListView';
import { IduDataQuery } from '#generated/types';

import EventListItem, { Props as EventListItemProps } from '../EventListItem';

import styles from './styles.css';

type IduRow = NonNullable<IduDataQuery['idu']>[number];

const MAX_EVENTS = 5;

interface LargestEvent {
    key: string;
    country: string | undefined | null;
    eventId: number | undefined | null;
    eventName: string | undefined | null;
    subtitle: string;
    displacementType: IduRow['displacement_type'];
    value: number;
}

const keySelector = (item: LargestEvent) => item.key;

function getSubtitle(datum: IduRow): string {
    const hazard = datum.type ?? datum.category;
    const main = [hazard, datum.locations_name].filter(isTruthyString).join(', ');
    if (isTruthyString(datum.displacement_start_date)) {
        return main ? `${main} · ${datum.displacement_start_date}` : datum.displacement_start_date;
    }
    return main;
}

interface Props {
    className?: string;
    idus: IduRow[] | undefined;
    startDate: string | undefined;
    endDate: string | undefined;
    onEventSelect: (eventId: number, eventName: string) => void;
    selectedEventId: number | undefined;
}

function LargestEvents(props: Props) {
    const {
        className,
        idus,
        startDate,
        endDate,
        onEventSelect,
        selectedEventId,
    } = props;

    const events = useMemo<LargestEvent[]>(() => (
        [...(idus ?? [])]
            .filter((d) => d.figure > 0)
            .sort((a, b) => compareNumber(a.figure, b.figure, -1))
            .slice(0, MAX_EVENTS)
            .map((d) => ({
                key: String(d.id),
                country: d.country,
                eventId: d.event_id,
                eventName: d.event_name,
                subtitle: getSubtitle(d),
                displacementType: d.displacement_type,
                value: d.figure,
            }))
    ), [idus]);

    const rendererParams = useCallback((_: string, event: LargestEvent): EventListItemProps => {
        const { eventId, eventName } = event;
        return {
            title: event.country,
            subtitle: event.subtitle,
            displacementType: event.displacementType,
            value: event.value,
            onClick: isDefined(eventId) && isDefined(eventName)
                ? () => onEventSelect(eventId, eventName)
                : undefined,
            selected: isDefined(selectedEventId) && eventId === selectedEventId,
        };
    }, [onEventSelect, selectedEventId]);

    const description = `Preliminary estimates of the largest events reported between ${startDate ?? ''} - ${endDate ?? ''}.`;

    return (
        <div className={_cs(styles.largestEvents, className)}>
            <div className={styles.heading}>
                Largest displacement events
            </div>
            <div className={styles.description}>
                {description}
            </div>
            <div className={styles.list}>
                <ListView
                    data={events}
                    keySelector={keySelector}
                    renderer={EventListItem}
                    rendererParams={rendererParams}
                    direction="vertical"
                    errored={false}
                    pending={false}
                    filtered={false}
                />
            </div>
        </div>
    );
}

export default LargestEvents;
