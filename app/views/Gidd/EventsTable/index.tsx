import React, { useMemo, useCallback } from 'react';
import {
    _cs,
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
import HazardType, { Props as HazardTypeProps } from '#components/IduMap/IduTable/HazardType';
import {
    GiddEventsQuery,
    GiddEventsQueryVariables,
} from '#generated/types';
import useDebouncedValue from '#hooks/useDebouncedValue';

import EventTitle, { Props as EventTitleProps } from '../EventTitle';

import styles from './styles.css';

const mediumNumberWidth = 100;

const dateWidth = 120;

const smallTextWidth = 200;
const largeTextWidth = 320;

type EventData = NonNullable<NonNullable<GiddEventsQuery['giddPublicDisasters']>['results']>[number];
type NumeralProps = React.ComponentProps<typeof Numeral>;
const eventKeySelector = (item: { id: string }) => item.id;

const description = 'The events table displays a summary of internal displacement data aggregated by events. An event is defined as any natural hazard phenomena that triggered forced movements before, during or after a disaster hit.';

const GIDD_EVENTS = gql`
query GiddEvents(
    $page: Int,
    $ordering: String,
    $pageSize: Int,
    $eventName: String,
    $endYear: Float,
    $startYear: Float,
    $hazardTypes: [ID!],
    $countriesIso3: [String!],
    $releaseEnvironment: String!,
    $clientId: String!,
){
    giddPublicDisasters(
        ordering: $ordering,
        pageSize: $pageSize,
        page: $page,
        filters: {
            eventName: $eventName,
            countriesIso3: $countriesIso3,
            endYear: $endYear,
            startYear: $startYear,
            hazardTypes: $hazardTypes,
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
            iso3
            newDisplacementRounded
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
    activePage: number;
    onActivePageChange: (newVal: number) => void;
    startYear: number;
    endYear: number;
    countriesIso3: string[] | undefined;
    hazardTypes: string[] | undefined;
    clientCode: string;
    searchText: string | undefined;
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
        clientCode,
        searchText,
    } = props;

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
        endYear,
        hazardTypes,
        pageSize: EVENTS_TABLE_PAGE_SIZE,
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        countriesIso3,
        startYear,
        endYear,
        searchText,
        hazardTypes,
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
            // FIXME: Skip is not working
            // skip: displacementCause !== 'disaster',
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
                columnWidth: smallTextWidth,
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
                columnWidth: largeTextWidth,
                columnStretch: true,
            };

            const displacementsColumn: TableColumn<
                EventData, string, NumeralProps, TableHeaderCellProps
            > = {
                id: 'newDisplacementRounded',
                title: 'Internal Displacements',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: true,
                },
                headerCellRendererClassName: _cs(
                    styles.numberHeader,
                    sortedHeaderClassName('newDisplacementRounded'),
                ),
                cellRenderer: Numeral,
                cellRendererClassName: styles.number,
                cellRendererParams: (_, data) => ({
                    value: data.newDisplacementRounded,
                    placeholder: '',
                    separator: ',',
                    valueClassName: styles.figure,
                    abbrClassName: styles.figure,
                }),
                columnWidth: mediumNumberWidth,
            };

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
                cellRendererParams: (_, data) => ({
                    value: (data.hazardTypeId && data.hazardTypeName)
                        ? getHazardTypeLabel({
                            id: data.hazardTypeId,
                            label: data.hazardTypeName,
                        })
                        : data.hazardTypeName,
                    category: data.hazardCategoryName,
                }),
                columnWidth: smallTextWidth,
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
                eventTypeColumn,
            ]);
        },
        [
            clientCode,
            sortedHeaderClassName,
        ],
    );

    return (
        <div className={_cs(className, styles.eventsTable)}>
            {description}
            <SortContext.Provider value={eventDataSortState}>
                <Table
                    containerClassName={styles.table}
                    data={eventsResponse?.giddPublicDisasters?.results}
                    keySelector={eventKeySelector}
                    columns={eventColumns}
                    resizableColumn
                />
                <Pager
                    className={styles.pager}
                    activePage={activePage}
                    itemsCount={eventsResponse?.giddPublicDisasters?.totalCount ?? 0}
                    maxItemsPerPage={EVENTS_TABLE_PAGE_SIZE}
                    onActivePageChange={onActivePageChange}
                    itemsPerPageControlHidden
                />
            </SortContext.Provider>
        </div>
    );
}

export default EventsTable;
