import React, { useMemo, useCallback } from 'react';
import {
    _cs,
    isTruthyString,
    compareNumber,
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
    country: string | undefined | null;
    // each row is one specific record, selected by its unique record id
    recordId: number;
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
    cause: 'all' | 'Conflict' | 'Disaster';
    startDate: string | undefined;
    endDate: string | undefined;
    // omitted (e.g. on mobile, where the map is hidden) to make rows non-clickable
    onRecordSelect?: (recordId: number) => void;
    selectedRecordId: number | undefined;
}

function LargestEvents(props: Props) {
    const {
        className,
        idus,
        cause,
        startDate,
        endDate,
        onRecordSelect,
        selectedRecordId,
    } = props;

    const events = useMemo<LargestEvent[]>(() => (
        [...(idus ?? [])]
            .filter((d) => d.figure > 0)
            .sort((a, b) => compareNumber(a.figure, b.figure, -1))
            .slice(0, MAX_EVENTS)
            .map((d) => ({
                key: String(d.id),
                country: d.country,
                recordId: d.id,
                subtitle: getSubtitle(d),
                displacementType: d.displacement_type,
                value: d.figure,
            }))
    ), [idus]);

    const rendererParams = useCallback((_: string, event: LargestEvent): EventListItemProps => ({
        title: event.country,
        subtitle: event.subtitle,
        displacementType: event.displacementType,
        value: event.value,
        onClick: onRecordSelect ? () => onRecordSelect(event.recordId) : undefined,
        selected: event.recordId === selectedRecordId,
    }), [onRecordSelect, selectedRecordId]);

    const description = `Preliminary estimates of the largest ${displacementTerm(cause)} displacements reported between ${formatDate(startDate)} and ${formatDate(endDate)}.`;

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
            <div className={styles.hint}>
                Click a row to pin the event on the map.
            </div>
        </div>
    );
}

export default LargestEvents;
