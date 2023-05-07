import React, { useMemo, useState } from 'react';
import {
    _cs,
} from '@togglecorp/fujs';
import {
    TextInput,
    Table,
    TableHeaderCell,
    TableHeaderCellProps,
    TableColumn,
    Pager,
    SortContext,
    useSortState,
    createDateColumn,
} from '@togglecorp/toggle-ui';
import { IoSearchOutline } from 'react-icons/io5';
import {
    roundAndRemoveZero,
    DATA_RELEASE,
} from '#utils/common';
import {
    gql,
    useQuery,
} from '@apollo/client';

import {
    createTextColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import {
    GiddEventsQuery,
    GiddEventsQueryVariables,
} from '#generated/types';
import useDebouncedValue from '#hooks/useDebouncedValue';

import EventTitle, { Props as EventTitleProps } from '../EventTitle';

import styles from './styles.css';

type EventData = NonNullable<NonNullable<GiddEventsQuery['giddDisasters']>['results']>[number];
const eventKeySelector = (item: { id: string }) => item.id;

const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

const GIDD_EVENTS = gql`
query GiddEvents(
    $page: Int,
    $ordering: String,
    $pageSize: Int,
    $eventName: String,
    $releaseEnvironment: String!,
){
    giddDisasters(
        ordering: $ordering,
        pageSize: $pageSize,
        eventName: $eventName,
        page: $page,
        releaseEnvironment: $releaseEnvironment,
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
            hazardTypeName
            iso3
            newDisplacement
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
}

function EventsTable(props: Props) {
    const {
        className,
    } = props;

    const eventDataSortState = useSortState({ name: 'year', direction: 'dsc' });
    const { sorting: eventSorting } = eventDataSortState;
    const [eventsActivePage, setEventsActivePage] = useState<number>(1);
    const [eventSearchText, setEventSearchText] = useState<string | undefined>();
    const finalEventSearchText = useDebouncedValue(eventSearchText);

    const giddEventsVariables = useMemo(() => ({
        eventName: finalEventSearchText,
        ordering: `${eventSorting?.direction === 'asc' ? '' : '-'}${eventSorting?.name}`,
        page: eventsActivePage,
        pageSize: EVENTS_TABLE_PAGE_SIZE,
        releaseEnvironment: DATA_RELEASE,
    }), [
        finalEventSearchText,
        eventSorting,
        eventsActivePage,
    ]);

    const {
        previousData: previousEventsResponse,
        data: eventsResponse = previousEventsResponse,
    } = useQuery<
        GiddEventsQuery,
        GiddEventsQueryVariables
    >(
        GIDD_EVENTS,
        {
            variables: giddEventsVariables,
            // FIXME: Skip is not working
            // skip: displacementCause !== 'disaster',
            context: {
                clientName: 'helix',
            },
        },
    );

    const eventColumns = useMemo(
        () => {
            const eventTitle: TableColumn<
                EventData, string, EventTitleProps, TableHeaderCellProps
            > = {
                id: 'eventName',
                title: 'Event Name',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: true,
                },
                cellRenderer: EventTitle,
                cellRendererParams: (_, data) => ({
                    title: data.eventName,
                    label: data.eventName,
                    eventId: data.eventId ?? undefined,
                }),
                columnWidth: 320,
            };

            return ([
                createTextColumn<EventData, string>(
                    'countryName',
                    'Country / Territory',
                    (item) => item.countryName,
                    { sortable: true },
                ),
                createNumberColumn<EventData, string>(
                    'year',
                    'Year',
                    (item) => Number(item.year),
                    {
                        sortable: true,
                        separator: '',
                        columnClassName: styles.year,
                    },
                ),
                eventTitle,
                createDateColumn<EventData, string>(
                    'startDate',
                    'Date of event (start)',
                    (item) => item.startDate,
                    {
                        sortable: true,
                        columnClassName: styles.date,
                    },
                ),
                createNumberColumn<EventData, string>(
                    'newDisplacement',
                    'Disaster Internal Displacements',
                    (item) => roundAndRemoveZero(item.newDisplacement ?? undefined),
                    { sortable: true },
                ),
                createTextColumn<EventData, string>(
                    'hazardCategoryName',
                    'Hazard Category',
                    (item) => item.hazardCategoryName,
                    { sortable: true },
                ),
                createTextColumn<EventData, string>(
                    'hazardTypeName',
                    'Hazard Type',
                    (item) => item.hazardTypeName,
                    { sortable: true },
                ),
            ]);
        },
        [],
    );

    return (
        <div className={_cs(className, styles.eventsTable)}>
            {lorem}
            <TextInput
                icons={(
                    <IoSearchOutline />
                )}
                className={styles.input}
                inputSectionClassName={styles.inputSection}
                name="eventTitle"
                label="Search Events"
                value={eventSearchText}
                onChange={setEventSearchText}
            />
            <SortContext.Provider value={eventDataSortState}>
                <Pager
                    className={styles.pager}
                    activePage={eventsActivePage}
                    itemsCount={eventsResponse?.giddDisasters?.totalCount ?? 0}
                    maxItemsPerPage={EVENTS_TABLE_PAGE_SIZE}
                    onActivePageChange={setEventsActivePage}
                    itemsPerPageControlHidden
                />
                <Table
                    containerClassName={styles.table}
                    data={eventsResponse?.giddDisasters?.results}
                    keySelector={eventKeySelector}
                    columns={eventColumns}
                />
            </SortContext.Provider>
        </div>
    );
}

export default EventsTable;
