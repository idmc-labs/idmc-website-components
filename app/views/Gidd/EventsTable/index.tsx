import React, { useMemo, useCallback } from 'react';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import {
    Table,
    TableHeaderCell,
    TableHeaderCellProps,
    TableColumn,
    Pager,
    SortContext,
    createDateColumn,
} from '@togglecorp/toggle-ui';
import {
    getHazardTypeLabel,
    DATA_RELEASE,
} from '#utils/common';
import {
    gql,
    useQuery,
} from '@apollo/client';

import Numeral from '#components/Numeral';
import Message from '#components/Message';
import PendingMessage from '#components/PendingMessage';
import HazardType, { Props as HazardTypeProps } from '#components/IduMap/IduTable/HazardType';
import useActiveVariables from '#hooks/useActiveVariables';
import useFilterState from '#hooks/useFilterState';
import useSyncedFilter from '#hooks/useSyncedFilter';
import {
    GiddEventsQuery,
    GiddEventsQueryVariables,
} from '#generated/types';

import EventTitle, { Props as EventTitleProps } from '../EventTitle';

import { CAUSE_BY_KEY } from '../utils';
import { GiddTableFilter, GiddEventsFilter } from '../types';

import styles from './styles.css';

const mediumNumberWidth = 120;

const dateWidth = 120;

const extraSmallTextWidth = 150;
const mediumTextWidth = 280;

type EventData = NonNullable<
    NonNullable<GiddEventsQuery['giddPublicDisplacementEvents']>['results']
>[number];
type NumeralProps = React.ComponentProps<typeof Numeral>;
const eventKeySelector = (item: { id: string }) => item.id;

function getCauseVariantClassName(eventCause: EventData['cause']) {
    if (eventCause === 'CONFLICT') {
        return styles.conflict;
    }
    if (eventCause === 'DISASTER') {
        return styles.disaster;
    }
    return undefined;
}

const GIDD_EVENTS = gql`
    query GiddEvents(
        $page: Int,
        $ordering: String,
        $pageSize: Int,
        $eventName: String,
        $cause: CRISIS_TYPE,
        $endYear: Int,
        $startYear: Int,
        $hazardTypes: [ID!],
        $violenceSubTypes: [ID!],
        $countriesIso3: [String!],
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicDisplacementEvents(
            ordering: $ordering,
            pageSize: $pageSize,
            page: $page,
            filters: {
                eventName: $eventName,
                countriesIso3: $countriesIso3,
                endYear: $endYear,
                startYear: $startYear,
                hazardTypes: $hazardTypes,
                violenceSubTypes: $violenceSubTypes,
                cause: $cause,
                releaseEnvironment: $releaseEnvironment,
            },
            clientId: $clientId,
        ){
            results {
                id
                countryName
                endDate
                eventId
                eventName
                hazardCategoryName
                hazardSubCategoryName
                hazardSubTypeName
                hazardTypeId
                hazardTypeName
                violenceId
                violenceName
                violenceSubTypeId
                violenceSubTypeName
                cause
                causeDisplay
                iso3
                newDisplacementRounded
                totalDisplacementRounded
                startDate
                year
            }
            totalCount
            page
            pageSize
        }
    }
`;

const EVENTS_TABLE_PAGE_SIZE = 10;

interface Props {
    className?: string;
    filter: GiddTableFilter;
    searchText: string | undefined;
    clientCode: string;
    abbreviate: boolean;
    /**
     * False while the pane is mounted but hidden: its loading overlay stays out of the visible
     * view, and its query holds the variables it last fetched with.
     */
    active?: boolean;
}

function EventsTable(props: Props) {
    const {
        className,
        filter: sharedFilter,
        searchText,
        clientCode,
        abbreviate,
        active = true,
    } = props;

    const {
        filter,
        page,
        rawPage,
        setPage,
        pageSize,
        ordering,
        sortState,
        setFilter,
    } = useFilterState<GiddEventsFilter>({
        filter: { ...sharedFilter, eventName: searchText },
        ordering: { name: 'startDate', direction: 'dsc' },
        pageSize: EVENTS_TABLE_PAGE_SIZE,
    });

    // The search box lives in the view toolbar rather than in this table, so its value arrives as
    // a prop and joins the shared filter here -- no other endpoint accepts an event name.
    const sharedEventsFilter = useMemo(() => ({
        ...sharedFilter,
        eventName: searchText,
    }), [sharedFilter, searchText]);

    useSyncedFilter(sharedEventsFilter, setFilter);

    const isFlowShown = filter.category !== 'stock';
    const isStockShown = filter.category !== 'flow';

    const { sorting: eventSorting } = sortState;

    const sortedHeaderClassName = useCallback((columnId: string) => (
        eventSorting?.name === columnId ? styles.sortedHeader : undefined
    ), [eventSorting]);

    const giddEventsVariables = useMemo(() => ({
        eventName: filter.eventName,
        ordering,
        page,
        countriesIso3: filter.countriesIso3,
        startYear: filter.startYear,
        cause: filter.cause ? CAUSE_BY_KEY[filter.cause] : undefined,
        endYear: filter.endYear,
        hazardTypes: filter.hazardTypes,
        violenceSubTypes: filter.violenceSubTypes,
        pageSize,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        filter,
        ordering,
        page,
        pageSize,
        clientCode,
    ]);

    const activeVariables = useActiveVariables(giddEventsVariables, active);

    const {
        previousData: previousEventsResponse,
        data: eventsResponse = previousEventsResponse,
        loading,
    } = useQuery<
        GiddEventsQuery,
        GiddEventsQueryVariables
    >(
        GIDD_EVENTS,
        {
            variables: activeVariables,
            context: {
                clientName: 'helix',
            },
        },
    );

    const eventColumns = useMemo(
        () => {
            const countryColumn: TableColumn<
                EventData, string, HazardTypeProps, TableHeaderCellProps
            > = {
                id: 'countryName',
                title: 'Country',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: true,
                },
                headerCellRendererClassName: sortedHeaderClassName('countryName'),
                cellRenderer: HazardType,
                cellRendererParams: (_, data) => ({
                    value: data.countryName,
                    category: String(data.year),
                }),
                columnWidth: extraSmallTextWidth,
            };

            const eventTitle: TableColumn<
                EventData, string, EventTitleProps, TableHeaderCellProps
            > = {
                id: 'eventName',
                title: 'Event Name',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: true,
                },
                headerCellRendererClassName: sortedHeaderClassName('eventName'),
                cellRenderer: EventTitle,
                cellRendererParams: (_, data) => ({
                    title: data.eventName,
                    label: data.eventName,
                    eventId: data.eventId ?? undefined,
                    clientId: clientCode,
                    cause: data.cause,
                    violenceSubTypeName: data.violenceSubTypeName,
                }),
                columnWidth: mediumTextWidth,
                columnStretch: true,
            };

            const displacementsColumn: TableColumn<
                EventData, string, NumeralProps, TableHeaderCellProps
            > | undefined = isFlowShown ? {
                id: 'newDisplacement',
                title: 'Internal Displacements',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: true,
                },
                headerCellRendererClassName: _cs(
                    styles.numberHeader,
                    sortedHeaderClassName('newDisplacement'),
                ),
                cellRenderer: Numeral,
                cellRendererClassName: styles.number,
                cellRendererParams: (_, data) => {
                    const valueClassName = _cs(
                        styles.figure,
                        getCauseVariantClassName(data.cause),
                    );
                    return {
                        value: data.newDisplacementRounded,
                        placeholder: '',
                        separator: ',',
                        abbreviate,
                        valueClassName,
                        abbrClassName: valueClassName,
                    };
                },
                columnWidth: mediumNumberWidth,
                columnStretch: true,
            } : undefined;

            const idpsColumn: TableColumn<
                EventData, string, NumeralProps, TableHeaderCellProps
            > | undefined = isStockShown ? {
                id: 'totalDisplacement',
                title: 'Internally Displaced People (IDPs)',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: true,
                },
                headerCellRendererClassName: _cs(
                    styles.numberHeader,
                    sortedHeaderClassName('totalDisplacement'),
                ),
                cellRenderer: Numeral,
                cellRendererClassName: styles.number,
                cellRendererParams: (_, data) => {
                    const valueClassName = _cs(
                        styles.figure,
                        getCauseVariantClassName(data.cause),
                    );
                    return {
                        value: data.totalDisplacementRounded,
                        placeholder: '',
                        separator: ',',
                        abbreviate,
                        valueClassName,
                        abbrClassName: valueClassName,
                    };
                },
                columnWidth: mediumNumberWidth,
                columnStretch: true,
            } : undefined;

            const eventTypeColumn: TableColumn<
                EventData, string, HazardTypeProps, TableHeaderCellProps
            > = {
                id: 'hazardTypeName',
                title: 'Event Type',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: true,
                },
                headerCellRendererClassName: sortedHeaderClassName('hazardTypeName'),
                cellRenderer: HazardType,
                cellRendererParams: (_, data) => {
                    if (data.cause === 'CONFLICT') {
                        return {
                            value: data.violenceSubTypeName,
                            category: data.violenceName,
                        };
                    }
                    return {
                        value: (data.hazardTypeId && data.hazardTypeName)
                            ? getHazardTypeLabel({
                                id: data.hazardTypeId,
                                label: data.hazardTypeName,
                            })
                            : data.hazardTypeName,
                        category: data.hazardCategoryName,
                    };
                },
                columnWidth: extraSmallTextWidth,
            };

            return ([
                countryColumn,
                eventTitle,
                createDateColumn<EventData, string>(
                    'startDate',
                    'Start Date',
                    (item) => item.startDate,
                    {
                        sortable: true,
                        columnWidth: dateWidth,
                        headerCellRendererClassName: sortedHeaderClassName('startDate'),
                    },
                ),
                displacementsColumn,
                idpsColumn,
                eventTypeColumn,
            ]).filter(isDefined);
        },
        [
            clientCode,
            sortedHeaderClassName,
            isFlowShown,
            isStockShown,
            abbreviate,
        ],
    );

    const eventRows = eventsResponse?.giddPublicDisplacementEvents?.results;
    // A pane that has just been shown has an in-flight query and no rows yet; the empty
    // message belongs to a finished query, not that gap.
    const isEmpty = !loading && (eventRows ?? []).length === 0;

    return (
        <div className={_cs(className, styles.eventsTable)}>
            {active && loading && <PendingMessage noDelay />}
            {isEmpty ? (
                <Message
                    empty
                    messageIconHidden
                    emptyMessage="No data available for the selected filters."
                />
            ) : (
                <SortContext.Provider value={sortState}>
                    <Table
                        // using dynamic key to reset the column width caching
                        key={eventColumns.map((column) => column.id).join(',')}
                        containerClassName={styles.table}
                        data={eventRows}
                        keySelector={eventKeySelector}
                        columns={eventColumns}
                        resizableColumn
                    />
                    <Pager
                        className={styles.pager}
                        activePage={rawPage}
                        itemsCount={eventsResponse?.giddPublicDisplacementEvents?.totalCount ?? 0}
                        maxItemsPerPage={pageSize}
                        onActivePageChange={setPage}
                        itemsPerPageControlHidden
                    />
                </SortContext.Provider>
            )}
        </div>
    );
}

export default EventsTable;
