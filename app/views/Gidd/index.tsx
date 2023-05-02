import React, { useMemo, useCallback, useState } from 'react';
import {
    _cs,
    isNotDefined,
    listToMap,
    listToGroupList,
    isDefined,
    compareNumber,
    randomString,
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
    sumAndRemoveZero,
    END_YEAR,
    roundAndRemoveZero,
    DATA_RELEASE,
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
    GiddStatisticsQuery,
    GiddStatisticsQueryVariables,
} from '#generated/types';

import EventTitle, { Props as EventTitleProps } from './EventTitle';

import styles from './styles.css';

const dummyConflictIdpsTimeseries = [
    {
        total: 560000,
        year: 2009,
    },
    {
        total: 700000,
        year: 2010,
    },
    {
        total: 700000,
        year: 2011,
    },
    {
        total: 1050000,
        year: 2012,
    },
    {
        total: 576000,
        year: 2013,
    },
    {
        total: 903900,
        year: 2014,
    },
    {
        total: 661763,
        year: 2015,
    },
    {
        total: 846275,
        year: 2016,
    },
    {
        total: 805746,
        year: 2017,
    },
    {
        total: 479446,
        year: 2018,
    },
    {
        total: 469624,
        year: 2019,
    },
    {
        total: 473079,
        year: 2020,
    },
    {
        total: 505667,
        year: 2021,
    },
];

const dummyDisasterIdpsTimeseries = [
    {
        total: 260000,
        year: 2009,
    },
    {
        total: 600000,
        year: 2010,
    },
    {
        total: 800000,
        year: 2011,
    },
    {
        total: 1050000,
        year: 2012,
    },
    {
        total: 776000,
        year: 2013,
    },
    {
        total: 703900,
        year: 2014,
    },
    {
        total: 961763,
        year: 2015,
    },
    {
        total: 246275,
        year: 2016,
    },
    {
        total: 505746,
        year: 2017,
    },
    {
        total: 479446,
        year: 2018,
    },
    {
        total: 969624,
        year: 2019,
    },
    {
        total: 673079,
        year: 2020,
    },
    {
        total: 605667,
        year: 2021,
    },
];

const dummyConflictIdpsTimeseriesByCountry = [
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 6662165,
        year: '2008',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 550000,
        year: '2008',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 5304000,
        year: '2009',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 18300,
        year: '2009',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 1411285,
        year: '2010',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 1503320,
        year: '2011',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 1647600,
        year: '2011',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 9110000,
        year: '2012',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 600,
        year: '2012',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 2144671,
        year: '2013',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 12474,
        year: '2013',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 3427618,
        year: '2014',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 74400,
        year: '2014',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 3654637,
        year: '2015',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 2622828,
        year: '2015',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 2400307,
        year: '2016',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 31338,
        year: '2016',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 1345994,
        year: '2017',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 383904,
        year: '2017',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 2675414,
        year: '2018',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 12191,
        year: '2018',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 5017722,
        year: '2019',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 120899,
        year: '2019',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 3856213,
        year: '2020',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 48141,
        year: '2020',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 4903210,
        year: '2021',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 32492,
        year: '2021',
    },
];

const dummyDisasterIdpsTimeseriesByCountry = [
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 8662165,
        year: '2008',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 350000,
        year: '2008',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 5304000,
        year: '2009',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 18300,
        year: '2009',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 1411285,
        year: '2010',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 1503320,
        year: '2011',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 46476,
        year: '2011',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 9110000,
        year: '2012',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 600,
        year: '2012',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 2144671,
        year: '2013',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 12474,
        year: '2013',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 3427618,
        year: '2014',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 74400,
        year: '2014',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 3654637,
        year: '2015',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 2622828,
        year: '2015',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 2400307,
        year: '2016',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 31338,
        year: '2016',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 1345994,
        year: '2017',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 383904,
        year: '2017',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 2675414,
        year: '2018',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 12191,
        year: '2018',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 5017722,
        year: '2019',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 120899,
        year: '2019',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 3856213,
        year: '2020',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 48141,
        year: '2020',
    },
    {
        country: {
            countryName: 'India',
            id: 52,
            iso3: 'IND',
        },
        total: 2903210,
        year: '2021',
    },
    {
        country: {
            countryName: 'Nepal',
            id: 84,
            iso3: 'NPL',
        },
        total: 52492,
        year: '2021',
    },
];

const brandColorsRange = [
    '#193256',
    '#6e7892',
    '#c3c7d2',
];

const conflictColorsRange = [
    'rgb(239, 125, 0)',
    'rgb(242, 179, 120)',
    'rgb(247, 204, 166)',
];

const disasterColorsRange = [
    'rgb(1, 142, 202)',
    'rgb(45, 183, 226)',
    'rgb(94, 217, 238)',
];

const MAX_ITEMS = 10;

const chartMargins = { top: 16, left: 5, right: 5, bottom: 5 };

const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
const lorem2 = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

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

const GIDD_STATISTICS = gql`
query GiddStatistics(
    $countriesIso3: [String!],
    $endYear: Float,
    $startYear: Float,
    $releaseEnvironment: String!,
){
    giddConflictStatistics(
        countriesIso3: $countriesIso3,
        endYear: $endYear,
        startYear: $startYear,
        releaseEnvironment: $releaseEnvironment,
    ) {
        totalDisplacementTimeseriesByYear {
            total
            year
        }
        newDisplacementTimeseriesByYear {
            total
            year
        }
        newDisplacements
        totalDisplacements
        totalCountries
    }
    giddDisasterStatistics(
        countriesIso3: $countriesIso3,
        endYear: $endYear,
        startYear: $startYear,
        releaseEnvironment: $releaseEnvironment,
    ){
        totalDisplacementTimeseriesByYear {
            total
            year
        }
        newDisplacementTimeseriesByYear {
            total
            year
        }
        newDisplacements
        totalDisplacements
        totalCountries
    }
}
`;

const EVENTS_TABLE_PAGE_SIZE = 20;

const GIDD_EVENTS = gql`
query GiddEvents(
    $page: Int,
    $ordering: String,
    $pageSize: Int,
    $releaseEnvironment: String!,
){
    giddDisasters(
        ordering: $ordering,
        pageSize: $pageSize,
        page: $page,
        releaseEnvironment: $releaseEnvironment,
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

function countryKeySelector(d: { iso3: string }) {
    return d.iso3;
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

type ChartType = 'combine' | 'compare';
type ChartTypeOption = {
    key: ChartType;
    label: string;
};
const chartTypeKeySelector = (option: ChartTypeOption) => option.key;
const chartTypeLabelSelector = (option: ChartTypeOption) => option.label;

const chartTypeOptions: ChartTypeOption[] = [
    {
        key: 'combine',
        label: 'Combined',
    },
    {
        key: 'compare',
        label: 'Compared',
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
    const [causeChartType, setCauseChartType] = useState<ChartType>('compare');
    const [displacementCategory, setDisplacementCategory] = useState<Category | undefined>();
    const timeRange = useDebouncedValue(timeRangeActual);
    const timeRangeArray = useMemo(() => (
        Array.from(
            { length: (timeRange[1] - timeRange[0]) + 1 },
            (_, index) => timeRange[0] + index,
        )
    ), [timeRange]);
    const [disasterFiltersShown, setDisasterFilterVisibility] = useState(false);
    const [
        countries,
        setCountries,
    ] = useInputState<string[]>(['NPL', 'IND']);
    const [countriesChartType, setCountriesChartType] = useState<ChartType>('compare');
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

    const statisticsVariables = useMemo(() => ({
        countriesIso3: countries,
        startYear: timeRange[0],
        endYear: timeRange[1],
        releaseEnvironment: DATA_RELEASE,
    }), [
        timeRange,
        countries,
    ]);

    const {
        data: statisticsResponse,
    } = useQuery<GiddStatisticsQuery, GiddStatisticsQueryVariables>(
        GIDD_STATISTICS,
        {
            variables: statisticsVariables,
            context: {
                clientName: 'helix',
            },
        },
    );

    const conflictStats = statisticsResponse?.giddConflictStatistics;
    const disasterStats = statisticsResponse?.giddDisasterStatistics;

    const [
        stockTimeseries,
        lineConfigs,
    ] = useMemo(() => {
        const showCombinedCountries = countriesChartType === 'combine' || countries.length > 3;

        if (causeChartType === 'combine' && showCombinedCountries) {
            const disasterDataByYear = listToMap(
                dummyDisasterIdpsTimeseries,
                (item) => item.year,
                (item) => item.total,
            );
            const conflictDataByYear = listToMap(
                dummyConflictIdpsTimeseries,
                (item) => item.year,
                (item) => item.total,
            );
            return [
                timeRangeArray.map((year) => ({
                    year,
                    total: sumAndRemoveZero([disasterDataByYear[year], conflictDataByYear[year]]),
                })),
                [
                    {
                        dataKey: 'total',
                        key: 'total',
                        stackId: 'total',
                        fill: 'var(--tui-color-brand)',
                        name: 'total',
                    },
                ],
            ];
        }
        if (causeChartType === 'compare' && showCombinedCountries) {
            const timeseries = [
                ...dummyConflictIdpsTimeseries.map((item) => ({
                    year: item.year,
                    conflict: item.total,
                })),
                ...dummyDisasterIdpsTimeseries.map((item) => ({
                    year: item.year,
                    disaster: item.total,
                })),
            ];
            return [
                timeseries,
                [
                    {
                        dataKey: 'disaster',
                        key: 'disaster',
                        stackId: 'total',
                        fill: 'var(--color-disaster)',
                        name: 'disaster',
                    },
                    {
                        dataKey: 'conflict',
                        key: 'conflict',
                        stackId: 'total',
                        fill: 'var(--color-conflict)',
                        name: 'conflict',
                    },
                ],
            ];
        }
        if (causeChartType === 'compare' && !showCombinedCountries) {
            const disasterDataByCountries = Object.values(listToGroupList(
                dummyDisasterIdpsTimeseriesByCountry,
                (item) => item.country.id,
                (item) => ({
                    iso3: item.country.iso3,
                    countryName: item.country.countryName,
                    year: Number(item.year),
                    [`disaster-${item.country.iso3}`]: item.total,
                }),
            )).flat();
            const conflictDataByCountries = Object.values(listToGroupList(
                dummyConflictIdpsTimeseriesByCountry,
                (item) => item.country.id,
                (item) => ({
                    iso3: item.country.iso3,
                    countryName: item.country.countryName,
                    year: Number(item.year),
                    [`conflict-${item.country.iso3}`]: item.total,
                }),
            )).flat();

            return [
                [
                    ...disasterDataByCountries,
                    ...conflictDataByCountries,
                ],
                countries.flatMap((country, index) => ([
                    {
                        dataKey: `disaster-${country}`,
                        key: `disaster-${country}`,
                        stackId: `total-${country}`,
                        fill: disasterColorsRange[index],
                        name: `${country} Disaster`,
                    },
                    {
                        dataKey: `conflict-${country}`,
                        key: `conflict-${country}`,
                        stackId: `total-${country}`,
                        fill: conflictColorsRange[index],
                        name: `${country} Conflict`,
                    },
                ])),
            ];
        }
        if (causeChartType === 'combine' && !showCombinedCountries) {
            const timeRangeByCountry = timeRangeArray.flatMap((year) => (
                countries.map((country) => `${year}-${country}`)
            ));
            const disasterDataByCountries = listToMap(
                dummyDisasterIdpsTimeseriesByCountry,
                (item) => `${item.year}-${item.country.iso3}` as string,
                (item) => ({
                    year: Number(item.year),
                    countryName: item.country.countryName,
                    iso3: item.country.iso3,
                    total: item.total,
                }),
            );
            const conflictDataByCountries = listToMap(
                dummyConflictIdpsTimeseriesByCountry,
                (item) => `${item.year}-${item.country.iso3}` as string,
                (item) => ({
                    year: Number(item.year),
                    countryName: item.country.countryName,
                    iso3: item.country.iso3,
                    total: item.total,
                }),
            );

            return [
                timeRangeByCountry.map((year) => ({
                    year: (disasterDataByCountries[year]?.year
                        ?? conflictDataByCountries[year]?.year),
                    countryName: (disasterDataByCountries[year]?.countryName
                        ?? conflictDataByCountries[year]?.countryName),
                    iso3: (disasterDataByCountries[year]?.iso3
                        ?? conflictDataByCountries[year]?.iso3),
                    [`total-${disasterDataByCountries[year]?.iso3 ?? conflictDataByCountries[year]?.iso3}`]: sumAndRemoveZero([
                        disasterDataByCountries[year]?.total,
                        conflictDataByCountries[year]?.total,
                    ]),
                })).filter((item) => isDefined(item.year)),
                countries.map((country, index) => ({
                    dataKey: `total-${country}`,
                    key: `total-${country}`,
                    stackId: country,
                    fill: brandColorsRange[index],
                    name: `Total for ${country}`,
                })),
            ];
        }

        return [
            [],
            [],
        ];
    }, [
        countries,
        countriesChartType,
        timeRangeArray,
        causeChartType,
    ]);

    const [
        flowTimeseries,
        barConfigs,
    ] = useMemo(() => {
        const showCombinedCountries = countriesChartType === 'combine' || countries.length > 3;

        if (causeChartType === 'combine' && showCombinedCountries) {
            const disasterDataByYear = listToMap(
                dummyDisasterIdpsTimeseries,
                (item) => item.year,
                (item) => item.total,
            );
            const conflictDataByYear = listToMap(
                dummyConflictIdpsTimeseries,
                (item) => item.year,
                (item) => item.total,
            );
            return [
                timeRangeArray.map((year) => ({
                    year,
                    total: sumAndRemoveZero([disasterDataByYear[year], conflictDataByYear[year]]),
                })),
                [
                    {
                        dataKey: 'total',
                        key: 'total',
                        stackId: 'total',
                        fill: 'var(--tui-color-brand)',
                        name: 'total',
                    },
                ],
            ];
        }
        if (causeChartType === 'compare' && showCombinedCountries) {
            const disasterDataByYear = listToMap(
                dummyDisasterIdpsTimeseries,
                (item) => item.year,
                (item) => item.total,
            );
            const conflictDataByYear = listToMap(
                dummyConflictIdpsTimeseries,
                (item) => item.year,
                (item) => item.total,
            );
            return [
                timeRangeArray.map((year) => ({
                    year,
                    conflict: conflictDataByYear[year],
                    disaster: disasterDataByYear[year],
                })),
                [
                    {
                        dataKey: 'disaster',
                        key: 'disaster',
                        stackId: 'total',
                        fill: 'var(--color-disaster)',
                        name: 'disaster',
                    },
                    {
                        dataKey: 'conflict',
                        key: 'conflict',
                        stackId: 'total',
                        fill: 'var(--color-conflict)',
                        name: 'conflict',
                    },
                ],
            ];
        }
        if (causeChartType === 'compare' && !showCombinedCountries) {
            const disasterDataByCountries = Object.values(listToGroupList(
                dummyDisasterIdpsTimeseriesByCountry,
                (item) => item.country.id,
                (item) => ({
                    year: Number(item.year),
                    [`disaster-${item.country.iso3}`]: item.total,
                }),
            )).flat();
            const conflictDataByCountries = Object.values(listToGroupList(
                dummyConflictIdpsTimeseriesByCountry,
                (item) => item.country.id,
                (item) => ({
                    year: Number(item.year),
                    [`conflict-${item.country.iso3}`]: item.total,
                }),
            )).flat();

            const timeseries = [
                ...disasterDataByCountries,
                ...conflictDataByCountries,
            ].reduce((acc, item) => {
                const indexForCurrentYear = acc.findIndex(
                    (accItem) => accItem.year === item.year,
                );
                if (indexForCurrentYear !== -1) {
                    const newItem = {
                        ...acc[indexForCurrentYear],
                        ...item,
                    };
                    const newList = [...acc];
                    newList.splice(indexForCurrentYear, 1, newItem);
                    return newList;
                }
                return [...acc, item];
            }, [] as { year: number; }[]);

            return [
                timeseries,
                countries.flatMap((country, index) => ([
                    {
                        dataKey: `disaster-${country}`,
                        key: `disaster-${country}`,
                        stackId: `total-${country}`,
                        fill: disasterColorsRange[index],
                        name: `${country} Disaster`,
                    },
                    {
                        dataKey: `conflict-${country}`,
                        key: `conflict-${country}`,
                        stackId: `total-${country}`,
                        fill: conflictColorsRange[index],
                        name: `${country} Conflict`,
                    },
                ])),
            ];
        }
        if (causeChartType === 'combine' && !showCombinedCountries) {
            const timeRangeByCountry = timeRangeArray.flatMap((year) => (
                countries.map((country) => `${year}-${country}`)
            ));
            const disasterDataByCountries = listToMap(
                dummyDisasterIdpsTimeseriesByCountry,
                (item) => `${item.year}-${item.country.iso3}` as string,
                (item) => ({
                    year: Number(item.year),
                    countryName: item.country.countryName,
                    iso3: item.country.iso3,
                    total: item.total,
                }),
            );
            const conflictDataByCountries = listToMap(
                dummyConflictIdpsTimeseriesByCountry,
                (item) => `${item.year}-${item.country.iso3}` as string,
                (item) => ({
                    year: Number(item.year),
                    countryName: item.country.countryName,
                    iso3: item.country.iso3,
                    total: item.total,
                }),
            );

            const timeseries = timeRangeByCountry.map((year) => ({
                year: (disasterDataByCountries[year]?.year
                    ?? conflictDataByCountries[year]?.year),
                [`total-${disasterDataByCountries[year]?.iso3 ?? conflictDataByCountries[year]?.iso3}`]: sumAndRemoveZero([
                    disasterDataByCountries[year]?.total,
                    conflictDataByCountries[year]?.total,
                ]),
            })).filter((item) => isDefined(item.year)).reduce((acc, item) => {
                const indexForCurrentYear = acc.findIndex(
                    (accItem) => accItem.year === item.year,
                );
                if (indexForCurrentYear !== -1) {
                    const newItem = {
                        ...acc[indexForCurrentYear],
                        ...item,
                    };
                    const newList = [...acc];
                    newList.splice(indexForCurrentYear, 1, newItem);
                    return newList;
                }
                return [...acc, item];
            }, [] as { year: number; }[]);

            return [
                timeseries,
                countries.map((country, index) => ({
                    dataKey: `total-${country}`,
                    key: `total-${country}`,
                    stackId: country,
                    fill: brandColorsRange[index],
                    name: `Total for ${country}`,
                })),
            ];
        }

        return [
            [],
            [],
        ];
    }, [
        countries,
        countriesChartType,
        timeRangeArray,
        causeChartType,
    ]);

    const giddEventsVariables = useMemo(() => ({
        ordering: `${eventSorting?.direction === 'asc' ? '' : '-'}${eventSorting?.name}`,
        page: (eventsActivePage - 1) * EVENTS_TABLE_PAGE_SIZE,
        releaseEnvironment: DATA_RELEASE,
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
                (item) => sumAndRemoveZero([item.disasterFlow, item.conflictFlow]),
                { sortable: true },
            ),
            createNumberColumn<DisplacementData, string>(
                'totalStock',
                'Total number of IDPS',
                (item) => sumAndRemoveZero([item.disasterStock, item.conflictStock]),
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
                                                name="category"
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
                                        secondaryInput={(
                                            <SelectInput
                                                name="countriesChartType"
                                                className={styles.selectInput}
                                                inputSectionClassName={_cs(
                                                    styles.inputSection,
                                                    styles.chartType,
                                                )}
                                                keySelector={chartTypeKeySelector}
                                                labelSelector={chartTypeLabelSelector}
                                                value={countriesChartType}
                                                onChange={setCountriesChartType}
                                                options={chartTypeOptions}
                                                nonClearable
                                            />
                                        )}
                                        input={(
                                            <MultiSelectInput
                                                name="country"
                                                className={styles.selectInput}
                                                value={countries}
                                                options={countriesOptions}
                                                keySelector={countryKeySelector}
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
                                        secondaryInput={(
                                            <SelectInput
                                                name="causeChartType"
                                                className={styles.selectInput}
                                                inputSectionClassName={_cs(
                                                    styles.inputSection,
                                                    styles.chartType,
                                                )}
                                                keySelector={chartTypeKeySelector}
                                                labelSelector={chartTypeLabelSelector}
                                                value={causeChartType}
                                                onChange={setCauseChartType}
                                                options={chartTypeOptions}
                                                nonClearable
                                            />
                                        )}
                                        input={(
                                            <SelectInput
                                                name="cause"
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
                                            data={flowTimeseries}
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
                                            {barConfigs.map((barConfig) => (
                                                <Bar
                                                    dataKey={barConfig.dataKey}
                                                    stackId={barConfig.stackId}
                                                    key={randomString()}
                                                    fill={barConfig.fill}
                                                    name={barConfig.name}
                                                />
                                            ))}
                                            {/*
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
                                            */}
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
                                            data={stockTimeseries}
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
                                            {lineConfigs.map((lineConfig) => (
                                                <Line
                                                    dataKey={lineConfig.dataKey}
                                                    key={lineConfig.key}
                                                    stroke={lineConfig.fill}
                                                    name={lineConfig.name}
                                                    strokeWidth={2}
                                                    connectNulls
                                                    dot
                                                />
                                            ))}
                                            {/*
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
                                            */}
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
