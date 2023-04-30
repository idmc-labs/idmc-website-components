import React, { useMemo, useCallback, useState } from 'react';
import {
    _cs,
    isNotDefined,
    isDefined,
    compareNumber,
} from '@togglecorp/fujs';
import {
    Button,
    Switch,
    SelectInput,
    MultiSelectInput,
    Table,
    TableHeaderCell,
    TableHeaderCellProps,
    TableColumn,
    Pager,
    SortContext,
    useSortState,
    createDateColumn,
    List,
} from '@togglecorp/toggle-ui';
import { removeNull } from '@togglecorp/toggle-form';
import {
    formatNumber,
    START_YEAR,
    add,
    END_YEAR,
    roundAndRemoveZero,
} from '#utils/common';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { IoExitOutline } from 'react-icons/io5';
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    LineChart,
    Line,
    BarChart,
    Bar,
} from 'recharts';

import ErrorBoundary from '#components/ErrorBoundary';
import SliderInput from '#components/SliderInput';
import Heading from '#components/Heading';
import Header from '#components/Header';
import ProgressLine from '#components/ProgressLine';
import NumberBlock from '#components/NumberBlock';
import useInputState from '#hooks/useInputState';
import GridFilterInputContainer from '#components/GridFilterInputContainer';
import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    createTextColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import {
    GiddFilterOptionsQuery,
    GiddFilterOptionsQueryVariables,
    GiddEventsQuery,
    GiddEventsQueryVariables,
} from '#generated/types';

import EventTitle, { Props as EventTitleProps } from './EventTitle';

import styles from './styles.css';

const MAX_ITEMS = 10;

const chartMargins = { top: 16, left: 5, right: 5, bottom: 5 };

const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
const lorem2 = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const dummyStockData = [
    {
        year: 2008,
        disaster: 200000,
        conflict: 300000,
    },
    {
        year: 2009,
        disaster: 300000,
        conflict: 200000,
    },
    {
        year: 2010,
        disaster: 400000,
        conflict: 220000,
    },
    {
        year: 2018,
        disaster: 700000,
        conflict: 320000,
    },
];

interface DisplacementData {
    id: string;
    countryName: string;
    year: number;
    disasterStock: number;
    conflictStock: number;
    disasterFlow: number;
    conflictFlow: number;
    totalStock: number;
    totalFlow: number;
}

const dummyOverviewTable: DisplacementData[] = [
    {
        id: '1',
        countryName: 'Afghanistan',
        year: 2008,
        disasterStock: 200000,
        conflictStock: 300000,
        disasterFlow: 200000,
        conflictFlow: 300000,
        totalStock: 500000,
        totalFlow: 500000,
    },
    {
        id: '2',
        countryName: 'Afghanistan',
        year: 2009,
        disasterStock: 600000,
        conflictStock: 200000,
        disasterFlow: 300000,
        conflictFlow: 800000,
        totalStock: 900000,
        totalFlow: 1000000,
    },
];

type EventData = NonNullable<NonNullable<GiddEventsQuery['giddDisasters']>['results']>[number];

interface HazardData {
    id: string;
    icon: React.ReactNode;
    displacement: number;
    hazardName: string;
}

const hazardKeySelector = (item: HazardData) => item.id;

const hazardDummyData: HazardData[] = [
    {
        id: '1',
        icon: <IoExitOutline />,
        displacement: 1000000,
        hazardName: 'Flood',
    },
    {
        id: '2',
        icon: <IoExitOutline />,
        displacement: 2000000,
        hazardName: 'Earthquake',
    },
    {
        id: '3',
        icon: <IoExitOutline />,
        displacement: 5000000,
        hazardName: 'Landslide',
    },
];

const eventKeySelector = (item: { id: string }) => item.id;
const displacementItemKeySelector = (item: { id: string }) => item.id;

const GIDD_FILTER_OPTIONS = gql`
query GiddFilterOptions {
    giddPublicCountries {
        id
        idmcShortName
        iso3
        region {
            id
            name
        }
    }
    giddHazardSubTypes {
        id
        name
    }
}
`;

const EVENTS_TABLE_PAGE_SIZE = 20;

const GIDD_EVENTS = gql`
query GiddEvents(
    $page: Int,
    $ordering: String,
    $pageSize: Int,
){
    giddDisasters(
        ordering: $ordering,
        pageSize: $pageSize,
        page: $page,
    ){
        results {
            id
            countryName
            createdAt
            endDate
            event {
                id
            }
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

function idSelector(d: { id: string }) {
    return d.id;
}

function nameSelector(d: { idmcShortName: string }) {
    return d.idmcShortName;
}

function hazardLabelSelector(d: { name: string }) {
    return d.name;
}

type Cause = 'conflict' | 'disaster';
type CauseOption = {
    key: Cause;
    label: string;
};
const causeKeySelector = (option: CauseOption) => option.key;
const causeLabelSelector = (option: CauseOption) => option.label;

const displacementCauseOptions: CauseOption[] = [
    {
        key: 'conflict',
        label: 'Conflict',
    },
    {
        key: 'disaster',
        label: 'Disaster',
    },
];

type Category = 'flow' | 'stock';
type CategoryOption = {
    key: Category;
    label: string;
};
const categoryKeySelector = (option: CategoryOption) => option.key;
const categoryLabelSelector = (option: CategoryOption) => option.label;
const displacementCategoryOptions: CategoryOption[] = [
    {
        key: 'flow',
        label: 'Internal Displacement',
    },
    {
        key: 'stock',
        label: 'Total Number of IDPs',
    },
];

function Gidd() {
    const [timeRangeActual, setDisasterTimeRange] = useState([START_YEAR, END_YEAR]);
    const [displacementCause, setDisplacementCause] = useState<Cause | undefined>();
    const [displacementCategory, setDisplacementCategory] = useState<Category | undefined>();
    const timeRange = useDebouncedValue(timeRangeActual);
    const [disasterFiltersShown, setDisasterFilterVisibility] = useState(false);
    const [
        countries,
        setCountries,
    ] = useInputState<string[]>([]);
    const [
        hazardSubTypes,
        setHazardSubTypes,
    ] = useInputState<string[]>([]);
    const overallDataSortState = useSortState({ name: 'countryName', direction: 'asc' });

    const eventDataSortState = useSortState({ name: 'countryName', direction: 'asc' });
    const { sorting: eventSorting } = eventDataSortState;
    const [activePage, setActivePage] = useState<number>(1);
    const [eventsActivePage, setEventsActivePage] = useState<number>(1);

    const { data: countryFilterResponse } = useQuery<
        GiddFilterOptionsQuery,
        GiddFilterOptionsQueryVariables
    >(
        GIDD_FILTER_OPTIONS,
        {
            context: {
                clientName: 'helix',
            },
        },
    );

    const giddEventsVariables = useMemo(() => ({
        ordering: `${eventSorting?.direction === 'asc' ? '' : '-'}${eventSorting?.name}`,
        page: (eventsActivePage - 1) * EVENTS_TABLE_PAGE_SIZE,
    }), [
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

    const countriesOptions = removeNull(
        countryFilterResponse?.giddPublicCountries,
    )?.filter(isDefined);

    const hazardOptions = removeNull(
        countryFilterResponse?.giddHazardSubTypes,
    )?.filter(isDefined);

    const isDisasterDataShown = displacementCause === 'disaster' || isNotDefined(displacementCause);
    const isConflictDataShown = displacementCause === 'conflict' || isNotDefined(displacementCause);

    const columns = useMemo(
        () => ([
            createTextColumn<DisplacementData, string>(
                'geo_name',
                'Country / Territory',
                (item) => item.countryName,
                { sortable: true },
            ),
            createNumberColumn<DisplacementData, string>(
                'year',
                'Year',
                (item) => item.year,
                {
                    sortable: true,
                    separator: '',
                },
            ),
            isConflictDataShown ? createNumberColumn<DisplacementData, string>(
                'conflict_new_displacements',
                'Conflict Internal Displacement',
                (item) => item.conflictFlow,
                {
                    sortable: true,
                    variant: 'conflict',
                },
            ) : undefined,
            isConflictDataShown ? createNumberColumn<DisplacementData, string>(
                'conflict_stock_displacement',
                'Conflict Total number of IDPs',
                (item) => item.conflictStock,
                {
                    sortable: true,
                    variant: 'conflict',
                },
            ) : undefined,
            isDisasterDataShown ? createNumberColumn<DisplacementData, string>(
                'disaster_new_displacements',
                'Disaster Internal Displacement',
                (item) => item.disasterFlow,
                {
                    sortable: true,
                    variant: 'disaster',
                },
            ) : undefined,
            isDisasterDataShown ? createNumberColumn<DisplacementData, string>(
                'disaster_stock_displacement',
                'Disaster Total number of IDPs',
                (item) => item.disasterStock,
                {
                    sortable: true,
                    variant: 'disaster',
                },
            ) : undefined,
            createNumberColumn<DisplacementData, string>(
                'totalNew',
                'Total Internal Displacement',
                (item) => add([item.disasterFlow, item.conflictFlow]),
                { sortable: true },
            ),
            createNumberColumn<DisplacementData, string>(
                'totalStock',
                'Total number of IDPS',
                (item) => add([item.disasterStock, item.conflictStock]),
                { sortable: true },
            ),
        ]).filter(isDefined),
        [
            isConflictDataShown,
            isDisasterDataShown,
        ],
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
                    eventId: data.id,
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

    const sortedHazards = useMemo(() => (
        hazardDummyData.sort((foo, bar) => compareNumber(foo.displacement, bar.displacement, -1))
    ), []);

    const hazardRendererParams = useCallback((_: string, hazard: HazardData) => ({
        total: sortedHazards[0]?.displacement,
        value: hazard.displacement,
        icon: hazard.icon,
        title: 'Internal Displacement',
    }), [sortedHazards]);

    return (
        <div className={styles.bodyContainer}>
            <div className={styles.gidd}>
                <div className={styles.filterContainer}>
                    <Heading darkMode>
                        IDMC Query Tool
                    </Heading>
                    <div className={styles.filterBodyContainer}>
                        <div className={_cs(styles.filterSection)}>
                            <p className={styles.headingDescription}>{lorem}</p>
                            <div className={styles.downloadSection}>
                                <p className={styles.downloadDescription}>{lorem2}</p>
                                <Button
                                    name={undefined}
                                    variant="primary"
                                >
                                    Download Dataset
                                </Button>
                            </div>
                        </div>
                        <div className={styles.right}>
                            <div className={styles.top}>
                                <div className={_cs(styles.filterSection)}>
                                    <GridFilterInputContainer
                                        label="Internal Displacement or Total Number of IDPs"
                                        helpText="Select internal displacement or total number of IDPs"
                                        input={(
                                            <SelectInput
                                                className={styles.selectInput}
                                                inputSectionClassName={styles.inputSection}
                                                keySelector={categoryKeySelector}
                                                labelSelector={categoryLabelSelector}
                                                value={displacementCategory}
                                                onChange={setDisplacementCategory}
                                                options={displacementCategoryOptions}
                                            />
                                        )}
                                    />
                                    <GridFilterInputContainer
                                        label="Regions, Countries, and/or Territories"
                                        labelDescription="*In compared view, up to 3 countries, regions, or territories can be selected"
                                        input={(
                                            <MultiSelectInput
                                                name="country"
                                                className={styles.selectInput}
                                                value={countries}
                                                options={countriesOptions}
                                                keySelector={idSelector}
                                                labelSelector={nameSelector}
                                                onChange={setCountries}
                                                inputSectionClassName={styles.inputSection}
                                            />
                                        )}
                                    />
                                </div>
                                <div className={_cs(styles.filterSection)}>
                                    <GridFilterInputContainer
                                        label="Conflict and Violence or Disaster"
                                        helpText="Select Conflict and Violence or Disaster"
                                        input={(
                                            <SelectInput
                                                className={styles.selectInput}
                                                inputSectionClassName={styles.inputSection}
                                                keySelector={causeKeySelector}
                                                labelSelector={causeLabelSelector}
                                                value={displacementCause}
                                                onChange={setDisplacementCause}
                                                options={displacementCauseOptions}
                                            />
                                        )}
                                    />
                                    <GridFilterInputContainer
                                        label="Timescale"
                                        labelDescription={`${timeRangeActual[0]} - ${timeRangeActual[1]}`}
                                        helpText="Select Timescale"
                                        input={(
                                            <SliderInput
                                                className={_cs(styles.sliderInput, styles.input)}
                                                hideValues
                                                min={START_YEAR}
                                                max={END_YEAR}
                                                step={1}
                                                minDistance={0}
                                                value={timeRangeActual}
                                                onChange={setDisasterTimeRange}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                            <div className={styles.border} />
                            <Switch
                                className={styles.switch}
                                labelClassName={styles.switchLabel}
                                name="additionalFilters"
                                value={displacementCause === 'disaster' && disasterFiltersShown}
                                onChange={setDisasterFilterVisibility}
                                label="Additional Disaster Filters"
                                disabled={displacementCause !== 'disaster'}
                            />
                            {disasterFiltersShown && displacementCause === 'disaster' && (
                                <div className={styles.disasterFilters}>
                                    <GridFilterInputContainer
                                        label="Disaster Hazard Type"
                                        input={(
                                            <MultiSelectInput
                                                name="disasterHazard"
                                                className={styles.selectInput}
                                                value={hazardSubTypes}
                                                options={hazardOptions ?? undefined}
                                                keySelector={idSelector}
                                                labelSelector={hazardLabelSelector}
                                                onChange={setHazardSubTypes}
                                                inputSectionClassName={styles.inputSection}
                                            />
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.statsContainer}>
                    {displacementCategory !== 'stock' && (
                        <div className={styles.statBox}>
                            <Header
                                heading="Internal Displacement Data"
                                headingDescription={lorem}
                            />
                            <div className={styles.border} />
                            {!displacementCause && (
                                <NumberBlock
                                    label="Total"
                                    size="large"
                                    subLabel="In XX countries and territories"
                                    value={400000000}
                                />
                            )}
                            <div className={styles.causesBlock}>
                                {isConflictDataShown && (
                                    <NumberBlock
                                        label="Total by Conflict and Violence"
                                        size={displacementCause ? 'large' : 'medium'}
                                        variant="conflict"
                                        subLabel="In XX countries and territories"
                                        value={30000000}
                                    />
                                )}
                                {isDisasterDataShown && (
                                    <NumberBlock
                                        label="Total by Disasters"
                                        size={displacementCause ? 'large' : 'medium'}
                                        variant="disaster"
                                        subLabel="In XX countries and territories"
                                        value={2000000}
                                    />
                                )}
                            </div>
                            <div className={styles.border} />
                            <div className={styles.chartContainer}>
                                <ErrorBoundary>
                                    <ResponsiveContainer>
                                        <BarChart
                                            data={dummyStockData}
                                            margin={chartMargins}
                                        >
                                            <CartesianGrid
                                                vertical={false}
                                                strokeDasharray="3 3"
                                            />
                                            <XAxis
                                                dataKey="year"
                                                axisLine={false}
                                                type="number"
                                                allowDecimals={false}
                                                domain={timeRange}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickFormatter={formatNumber}
                                            />
                                            <Tooltip
                                                formatter={formatNumber}
                                            />
                                            <Legend />
                                            {isDisasterDataShown && (
                                                <Bar
                                                    dataKey="disaster"
                                                    stackId="bar"
                                                    fill="var(--color-disaster)"
                                                    name="Disaster Internal Displacements"
                                                />
                                            )}
                                            {isConflictDataShown && (
                                                <Bar
                                                    dataKey="conflict"
                                                    stackId="bar"
                                                    fill="var(--color-conflict)"
                                                    name="Conflict Internal Displacements"
                                                />
                                            )}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ErrorBoundary>
                            </div>
                            {displacementCause === 'disaster' && (
                                <>
                                    <NumberBlock
                                        label=""
                                        size="medium"
                                        variant="disaster"
                                        subLabel="Disaster Events Reported"
                                        value={400000000}
                                    />
                                    <div className={styles.border} />
                                    <List
                                        rendererParams={hazardRendererParams}
                                        renderer={ProgressLine}
                                        keySelector={hazardKeySelector}
                                        data={sortedHazards}
                                    />
                                </>
                            )}
                        </div>
                    )}
                    {displacementCategory !== 'flow' && (
                        <div className={styles.statBox}>
                            <Header
                                heading="Total Number of IDPs Data"
                                headingDescription={lorem}
                            />
                            <div className={styles.border} />
                            {!displacementCause && (
                                <NumberBlock
                                    label="Total"
                                    size="large"
                                    subLabel="In XX countries and territories"
                                    value={400000000}
                                />
                            )}
                            <div className={styles.causesBlock}>
                                {isConflictDataShown && (
                                    <NumberBlock
                                        label="Total by Conflict and Violence"
                                        variant="conflict"
                                        size={displacementCause ? 'large' : 'medium'}
                                        subLabel="In XX countries and territories"
                                        value={30000000}
                                    />
                                )}
                                {isDisasterDataShown && (
                                    <NumberBlock
                                        label="Total by Disasters"
                                        size={displacementCause ? 'large' : 'medium'}
                                        variant="disaster"
                                        subLabel="In XX countries and territories"
                                        value={2000000}
                                    />
                                )}
                            </div>
                            <div className={styles.border} />
                            <div className={styles.chartContainer}>
                                <ErrorBoundary>
                                    <ResponsiveContainer>
                                        <LineChart
                                            data={dummyStockData}
                                            margin={chartMargins}
                                        >
                                            <CartesianGrid
                                                vertical={false}
                                                strokeDasharray="3 3"
                                            />
                                            <XAxis
                                                dataKey="year"
                                                axisLine={false}
                                                type="number"
                                                allowDecimals={false}
                                                domain={timeRange}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickFormatter={formatNumber}
                                            />
                                            <Tooltip
                                                formatter={formatNumber}
                                            />
                                            <Legend />
                                            {isDisasterDataShown && (
                                                <Line
                                                    dataKey="disaster"
                                                    key="disaster"
                                                    stroke="var(--color-disaster)"
                                                    name="Disaster Internal Displacements"
                                                    strokeWidth={2}
                                                    connectNulls
                                                    dot
                                                />
                                            )}
                                            {isConflictDataShown && (
                                                <Line
                                                    dataKey="conflict"
                                                    key="conflict"
                                                    stroke="var(--color-conflict)"
                                                    name="Conflict Internal Displacements"
                                                    strokeWidth={2}
                                                    connectNulls
                                                    dot
                                                />
                                            )}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ErrorBoundary>
                            </div>
                        </div>
                    )}
                </div>
                <div className={styles.tableContainer}>
                    <Header
                        heading="Data Table"
                        headingDescription={lorem}
                    />
                    <SortContext.Provider value={overallDataSortState}>
                        <Pager
                            className={styles.pager}
                            activePage={activePage}
                            itemsCount={dummyOverviewTable?.length ?? 0}
                            maxItemsPerPage={MAX_ITEMS}
                            onActivePageChange={setActivePage}
                            itemsPerPageControlHidden
                        />
                        <Table
                            className={styles.table}
                            data={dummyOverviewTable}
                            keySelector={displacementItemKeySelector}
                            columns={columns}
                        />
                    </SortContext.Provider>
                </div>
                {displacementCause === 'disaster' && (
                    <div className={styles.tableContainer}>
                        <Header
                            heading="Events Table"
                            headingDescription={lorem}
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
                                className={styles.table}
                                data={eventsResponse?.giddDisasters?.results}
                                keySelector={eventKeySelector}
                                columns={eventColumns}
                            />
                        </SortContext.Provider>
                    </div>
                )}
            </div>
        </div>
    );
}
export default Gidd;
