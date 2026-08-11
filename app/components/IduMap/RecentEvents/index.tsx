import React, { useMemo, useCallback } from 'react';
import {
    _cs,
    isDefined,
    listToGroupList,
    mapToList,
    sum,
    compareNumber,
} from '@togglecorp/fujs';

import ListView from '#components/ListView';
import { IduDataQuery } from '#generated/types';

import EventListItem, { Props as EventListItemProps } from '../EventListItem';
import { getDisplacementVariant, DisplacementType } from '../utils';

import styles from './styles.css';

type IduRow = NonNullable<IduDataQuery['idu']>[number];

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const RECENT_DAYS = 60;

interface RecentEvent {
    key: string;
    id: number | undefined | null;
    title: string | undefined | null;
    code: string | undefined | null;
    displacementType: DisplacementType | null;
    total: number;
    latestTime: number;
}

const eventKeySelector = (item: RecentEvent) => item.key;

interface Props {
    className?: string;
    idus: IduRow[] | undefined;
    onEventSelect: (eventId: number, eventName: string) => void;
    selectedEventId: number | undefined;
}

function RecentEvents(props: Props) {
    const {
        className,
        idus,
        onEventSelect,
        selectedEventId,
    } = props;

    const events = useMemo<RecentEvent[]>(() => {
        const cutoff = new Date().getTime() - (RECENT_DAYS * DAY_IN_MS);
        const recent = (idus ?? []).filter((d) => (
            isDefined(d.displacement_date)
            && new Date(d.displacement_date).getTime() >= cutoff
        ));

        const grouped = listToGroupList(recent, (d) => d.event_id ?? -1);
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
                displacementType: getDisplacementVariant(first.displacement_type),
                total: sum(items.map((item) => item.figure)),
                latestTime,
            };
        });

        return [...list].sort((a, b) => compareNumber(a.latestTime, b.latestTime, -1));
    }, [idus]);

    const rendererParams = useCallback((_: string, item: RecentEvent): EventListItemProps => {
        const { id, title } = item;
        return {
            title,
            subtitle: item.code,
            subtitleMonospace: true,
            displacementType: item.displacementType,
            value: item.total,
            onClick: isDefined(id) && isDefined(title)
                ? () => onEventSelect(id, title)
                : undefined,
            selected: isDefined(selectedEventId) && id === selectedEventId,
        };
    }, [onEventSelect, selectedEventId]);

    return (
        <div className={_cs(styles.recentEvents, className)}>
            <div className={styles.heading}>
                The most recent recorded events
            </div>
            <div className={styles.description}>
                {/* eslint-disable-next-line max-len */}
                Preliminary estimates of internal displacement events from the past 60 days.
            </div>
            <ListView
                className={styles.list}
                data={events}
                keySelector={eventKeySelector}
                renderer={EventListItem}
                rendererParams={rendererParams}
                direction="vertical"
                errored={false}
                pending={false}
                filtered={false}
            />
        </div>
    );
}

export default RecentEvents;
