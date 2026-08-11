import React, { useMemo } from 'react';
import {
    _cs,
    isDefined,
    isTruthyString,
    compareNumber,
} from '@togglecorp/fujs';

import { IduDataQuery } from '#generated/types';

import EventListItem from '../EventListItem';
import { getDisplacementVariant, DisplacementType } from '../utils';

import styles from './styles.css';

type IduRow = NonNullable<IduDataQuery['idu']>[number];

const MAX_EVENTS = 5;

interface LargestEvent {
    key: string;
    country: string | undefined | null;
    eventId: number | undefined | null;
    eventName: string | undefined | null;
    subtitle: string;
    displacementType: DisplacementType | null;
    value: number;
}

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
                displacementType: getDisplacementVariant(d.displacement_type),
                value: d.figure,
            }))
    ), [idus]);

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
                {events.map((event) => {
                    const { eventId, eventName } = event;
                    const handleClick = isDefined(eventId) && isDefined(eventName)
                        ? () => onEventSelect(eventId, eventName)
                        : undefined;
                    const selected = isDefined(selectedEventId)
                        && eventId === selectedEventId;
                    return (
                        <EventListItem
                            key={event.key}
                            title={event.country}
                            subtitle={event.subtitle}
                            displacementType={event.displacementType}
                            value={event.value}
                            onClick={handleClick}
                            selected={selected}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default LargestEvents;
