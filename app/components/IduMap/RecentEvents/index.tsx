import React, { useMemo, useCallback, useState } from 'react';
import {
    _cs,
    isDefined,
    listToGroupList,
    mapToList,
    sum,
    compareNumber,
} from '@togglecorp/fujs';

import ListView from '#components/ListView';
import RawButton from '#components/RawButton';
import { IduDataQuery } from '#generated/types';

import EventListItem, { Props as EventListItemProps } from '../EventListItem';

import styles from './styles.css';

type IduRow = NonNullable<IduDataQuery['idu']>[number];

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const RECENT_DAYS = 60;
const PAGE_SIZE = 10;

interface RecentEvent {
    key: string;
    id: number | undefined | null;
    title: string | undefined | null;
    code: string | undefined | null;
    displacementType: IduRow['displacement_type'];
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

    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
                displacementType: first.displacement_type,
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
                Preliminary estimates of internal displacement events from the past 60 days.
            </div>
            <div className={styles.list}>
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
        </div>
    );
}

export default RecentEvents;
