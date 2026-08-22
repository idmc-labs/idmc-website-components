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
    useSortState,
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
import HazardType, { Props as HazardTypeProps } from '#components/IduMap/IduTable/HazardType';
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    GiddEventsQuery,
    GiddEventsQueryVariables,
} from '#generated/types';

import EventTitle, { Props as EventTitleProps } from '../EventTitle';

import styles from './styles.css';

const mediumNumberWidth = 120;

const dateWidth = 120;

const extraSmallTextWidth = 150;
const mediumTextWidth = 280;

type EventData = NonNullable<
    NonNullable<GiddEventsQuery['giddPublicEvents']>['results']
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
        $cause: String,
        $endYear: Float,
        $startYear: Float,
        $hazardTypes: [ID!],
        $violenceSubTypes: [ID!],
        $countriesIso3: [String!],
        $releaseEnvironment: String!,
        $clientId: String!,
    ){
        giddPublicEvents(
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
                newDisplacement
                totalDisplacement
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

type Category = 'flow' | 'stock';

interface Props {
    className?: string;
    activePage: number;
    onActivePageChange: (newVal: number) => void;
    startYear: number;
    endYear: number;
    cause: string | undefined;
    category: Category | undefined;
    countriesIso3: string[] | undefined;
    hazardTypes: string[] | undefined;
    violenceSubTypes: string[] | undefined;
    clientCode: string;
    searchText: string | undefined;
    abbreviate: boolean;
}

function EventsTable(props: Props) {
    const {
        className,
        activePage,
        onActivePageChange,
        startYear,
        endYear,
        countriesIso3,
        hazardTypes,
        violenceSubTypes,
        clientCode,
        searchText,
        cause,
        category,
        abbreviate,
    } = props;

    const isFlowShown = category !== 'stock';
    const isStockShown = category !== 'flow';

    const eventDataSortState = useSortState({ name: 'startDate', direction: 'dsc' });
    const { sorting: eventSorting } = eventDataSortState;

    const sortedHeaderClassName = useCallback((columnId: string) => (
        eventSorting?.name === columnId ? styles.sortedHeader : undefined
    ), [eventSorting]);

    const giddEventsVariables = useMemo(() => ({
        eventName: searchText,
        ordering: `${eventSorting?.direction === 'asc' ? '' : '-'}${eventSorting?.name}`,
        page: activePage,
        countriesIso3,
        startYear,
        cause,
        endYear,
        hazardTypes,
        violenceSubTypes,
        pageSize: EVENTS_TABLE_PAGE_SIZE,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        countriesIso3,
        startYear,
        cause,
        endYear,
        searchText,
        hazardTypes,
        violenceSubTypes,
        eventSorting,
        activePage,
        clientCode,
    ]);

    const debouncedVariables = useDebouncedValue(giddEventsVariables);

    const {
        previousData: previousEventsResponse,
        data: eventsResponse = previousEventsResponse,
    } = useQuery<
        GiddEventsQuery,
        GiddEventsQueryVariables
    >(
        GIDD_EVENTS,
        {
            variables: debouncedVariables,
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
                        value: data.newDisplacement,
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
                        value: data.totalDisplacement,
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

    const eventRows = eventsResponse?.giddPublicEvents?.results;
    const isEmpty = (eventRows ?? []).length === 0;

    return (
        <div className={_cs(className, styles.eventsTable)}>
            {isEmpty ? (
                <Message
                    empty
                    messageIconHidden
                    emptyMessage="No data available for the selected filters."
                />
            ) : (
                <SortContext.Provider value={eventDataSortState}>
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
                        activePage={activePage}
                        itemsCount={eventsResponse?.giddPublicEvents?.totalCount ?? 0}
                        maxItemsPerPage={EVENTS_TABLE_PAGE_SIZE}
                        onActivePageChange={onActivePageChange}
                        itemsPerPageControlHidden
                    />
                </SortContext.Provider>
            )}
        </div>
    );
}

export default EventsTable;
