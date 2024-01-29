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
    getHazardTypeLabel,
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

type EventData = NonNullable<NonNullable<GiddEventsQuery['giddPublicDisasters']>['results']>[number];
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
            glideNumbers
            eventCodes
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
    } = props;

    const eventDataSortState = useSortState({ name: 'year', direction: 'dsc' });
    const { sorting: eventSorting } = eventDataSortState;
    const [eventSearchText, setEventSearchText] = useState<string | undefined>();

    const giddEventsVariables = useMemo(() => ({
        eventName: eventSearchText,
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
        eventSearchText,
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
                    clientId: clientCode,
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
                createTextColumn<EventData, string>(
                    'eventCodes',
                    'Event Codes',
                    // NOTE: We are deprecating glideNumber and replacing with eventCode
                    (item) => item.eventCodes?.join('; ') || item.glideNumbers?.join('; '),
                    { sortable: true },
                ),
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
                    'newDisplacementRounded',
                    'Disaster Internal Displacements',
                    (item) => item.newDisplacementRounded,
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
                    (item) => ((item.hazardTypeId && item.hazardTypeName)
                        ? getHazardTypeLabel({
                            id: item.hazardTypeId,
                            label: item.hazardTypeName,
                        })
                        : item.hazardTypeName),
                    { sortable: true },
                ),
            ]);
        },
        [clientCode],
    );

    return (
        <div className={_cs(className, styles.eventsTable)}>
            {description}
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
                    activePage={activePage}
                    itemsCount={eventsResponse?.giddPublicDisasters?.totalCount ?? 0}
                    maxItemsPerPage={EVENTS_TABLE_PAGE_SIZE}
                    onActivePageChange={onActivePageChange}
                    itemsPerPageControlHidden
                />
                <Table
                    containerClassName={styles.table}
                    data={eventsResponse?.giddPublicDisasters?.results}
                    keySelector={eventKeySelector}
                    columns={eventColumns}
                />
            </SortContext.Provider>
        </div>
    );
}

export default EventsTable;
