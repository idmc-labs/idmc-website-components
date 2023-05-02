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
    Pager,
    SortContext,
    useSortState,
    List,
} from '@togglecorp/toggle-ui';
import { removeNull } from '@togglecorp/toggle-form';
import {
    formatNumber,
    START_YEAR,
    sumAndRemoveZero,
    END_YEAR,
    DATA_RELEASE,
} from '#utils/common';
import {
    gql,
    useQuery,
} from '@apollo/client';
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
import DisplacementIcon from '#components/DisplacementIcon';
import {
    createTextColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import {
    GiddFilterOptionsQuery,
    GiddFilterOptionsQueryVariables,
    GiddDisplacementsQuery,
    GiddDisplacementsQueryVariables,
    GiddStatisticsQuery,
    GiddStatisticsQueryVariables,
} from '#generated/types';

import EventsTable from './EventsTable';

import styles from './styles.css';

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

const chartMargins = { top: 16, left: 5, right: 5, bottom: 5 };

const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
const lorem2 = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

type DisplacementData = NonNullable<NonNullable<GiddDisplacementsQuery['giddDisplacements']>['results']>[number];
type HazardData = NonNullable<NonNullable<GiddStatisticsQuery['giddDisasterStatistics']>['displacementsByHazardType']>[number];

const hazardKeySelector = (item: HazardData) => item.id;

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
    $hazardSubTypes: [String!],
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
        totalDisplacementTimeseriesByCountry {
            country {
                countryName
                id
                iso3
            }
            total
            year
        }
        newDisplacementTimeseriesByCountry {
            country {
                countryName
                id
                iso3
            }
            total
            year
        }
        newDisplacements
        totalDisplacements
        totalCountries
    }
    giddDisasterStatistics(
        hazardSubTypes: $hazardSubTypes,
        countriesIso3: $countriesIso3,
        endYear: $endYear,
        startYear: $startYear,
        releaseEnvironment: $releaseEnvironment,
    ){
        displacementsByHazardType {
            id
            label
            newDisplacements
        }
        totalDisplacementTimeseriesByYear {
            total
            year
        }
        newDisplacementTimeseriesByYear {
            total
            year
        }
        totalDisplacementTimeseriesByCountry {
            country {
                countryName
                id
                iso3
            }
            total
            year
        }
        newDisplacementTimeseriesByCountry {
            country {
                countryName
                id
                iso3
            }
            total
            year
        }
        newDisplacements
        totalDisplacements
        totalCountries
        totalEvents
    }
}
`;

const DISPLACEMENTS_TABLE_PAGE_SIZE = 10;

const GIDD_DISPLACEMENTS = gql`
query GiddDisplacements(
    $page: Int,
    $ordering: String,
    $pageSize: Int,
    $releaseEnvironment: String!,
){
    giddDisplacements(
        ordering: $ordering,
        pageSize: $pageSize,
        page: $page,
        releaseEnvironment: $releaseEnvironment,
    ){
        results {
            conflictNewDisplacement
            conflictTotalDisplacement
            countryName
            disasterNewDisplacement
            disasterTotalDisplacement
            id
            iso3
            totalInternalDisplacement
            totalNewDisplacement
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
    ] = useInputState<string[]>([]);
    const [countriesChartType, setCountriesChartType] = useState<ChartType>('compare');
    const [
        hazardSubTypes,
        setHazardSubTypes,
    ] = useInputState<string[]>([]);
    const overallDataSortState = useSortState({ name: 'countryName', direction: 'asc' });
    const { sorting } = overallDataSortState;

    const [activePage, setActivePage] = useState<number>(1);

    const isDisasterDataShown = displacementCause === 'disaster' || isNotDefined(displacementCause);
    const isConflictDataShown = displacementCause === 'conflict' || isNotDefined(displacementCause);

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
        hazardSubTypes,
        startYear: timeRange[0],
        endYear: timeRange[1],
        releaseEnvironment: DATA_RELEASE,
    }), [
        hazardSubTypes,
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

    const conflictStats = removeNull(statisticsResponse?.giddConflictStatistics);
    const disasterStats = removeNull(statisticsResponse?.giddDisasterStatistics);

    const [
        stockTimeseries,
        lineConfigs,
    ] = useMemo(() => {
        const showCombinedCountries = countriesChartType === 'combine' || countries.length > 3 || countries.length === 0;

        if (causeChartType === 'combine' && showCombinedCountries) {
            const disasterDataByYear = listToMap(
                disasterStats?.totalDisplacementTimeseriesByYear,
                (item) => item.year,
                (item) => item.total,
            );
            const conflictDataByYear = listToMap(
                conflictStats?.totalDisplacementTimeseriesByYear,
                (item) => item.year,
                (item) => item.total,
            );
            return [
                timeRangeArray.map((year) => ({
                    year,
                    total: sumAndRemoveZero([
                        isDisasterDataShown ? disasterDataByYear?.[year] : undefined,
                        isConflictDataShown ? conflictDataByYear?.[year] : undefined,
                    ]),
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
                ...(conflictStats?.totalDisplacementTimeseriesByYear?.map((item) => ({
                    year: item.year,
                    conflict: item.total,
                })) ?? []),
                ...(disasterStats?.totalDisplacementTimeseriesByYear?.map((item) => ({
                    year: item.year,
                    disaster: item.total,
                })) ?? []),
            ];
            return [
                timeseries,
                [
                    isDisasterDataShown ? {
                        dataKey: 'disaster',
                        key: 'disaster',
                        stackId: 'total',
                        fill: 'var(--color-disaster)',
                        name: 'disaster',
                    } : undefined,
                    isConflictDataShown ? {
                        dataKey: 'conflict',
                        key: 'conflict',
                        stackId: 'total',
                        fill: 'var(--color-conflict)',
                        name: 'conflict',
                    } : undefined,
                ].filter(isDefined),
            ];
        }
        if (causeChartType === 'compare' && !showCombinedCountries) {
            const disasterDataByCountries = Object.values(listToGroupList(
                disasterStats?.totalDisplacementTimeseriesByCountry ?? [],
                (item) => item.country.id,
                (item) => ({
                    iso3: item.country.iso3,
                    countryName: item.country.countryName,
                    year: Number(item.year),
                    [`disaster-${item.country.iso3}`]: item.total,
                }),
            )).flat();
            const conflictDataByCountries = Object.values(listToGroupList(
                conflictStats?.totalDisplacementTimeseriesByCountry ?? [],
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
                    isDisasterDataShown ? {
                        dataKey: `disaster-${country}`,
                        key: `disaster-${country}`,
                        stackId: `total-${country}`,
                        fill: disasterColorsRange[index],
                        name: `${country} Disaster`,
                    } : undefined,
                    isConflictDataShown ? {
                        dataKey: `conflict-${country}`,
                        key: `conflict-${country}`,
                        stackId: `total-${country}`,
                        fill: conflictColorsRange[index],
                        name: `${country} Conflict`,
                    } : undefined,
                ])).filter(isDefined),
            ];
        }
        if (causeChartType === 'combine' && !showCombinedCountries) {
            const timeRangeByCountry = timeRangeArray.flatMap((year) => (
                countries.map((country) => `${year}-${country}`)
            ));
            const disasterDataByCountries = listToMap(
                disasterStats?.totalDisplacementTimeseriesByCountry ?? [],
                (item) => `${item.year}-${item.country.iso3}` as string,
                (item) => ({
                    year: Number(item.year),
                    countryName: item.country.countryName,
                    iso3: item.country.iso3,
                    total: item.total,
                }),
            );
            const conflictDataByCountries = listToMap(
                conflictStats?.totalDisplacementTimeseriesByCountry ?? [],
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
                        isDisasterDataShown ? disasterDataByCountries[year]?.total : undefined,
                        isConflictDataShown ? conflictDataByCountries[year]?.total : undefined,
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
        isConflictDataShown,
        isDisasterDataShown,
        conflictStats,
        disasterStats,
        countries,
        countriesChartType,
        timeRangeArray,
        causeChartType,
    ]);

    const [
        flowTimeseries,
        barConfigs,
    ] = useMemo(() => {
        const showCombinedCountries = countriesChartType === 'combine' || countries.length > 3 || countries.length === 0;

        if (causeChartType === 'combine' && showCombinedCountries) {
            const disasterDataByYear = listToMap(
                disasterStats?.newDisplacementTimeseriesByYear,
                (item) => item.year,
                (item) => item.total,
            );
            const conflictDataByYear = listToMap(
                conflictStats?.newDisplacementTimeseriesByYear,
                (item) => item.year,
                (item) => item.total,
            );
            return [
                timeRangeArray.map((year) => ({
                    year,
                    total: sumAndRemoveZero([
                        isDisasterDataShown ? disasterDataByYear?.[year] : undefined,
                        isConflictDataShown ? conflictDataByYear?.[year] : undefined,
                    ]),
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
                disasterStats?.newDisplacementTimeseriesByYear,
                (item) => item.year,
                (item) => item.total,
            );
            const conflictDataByYear = listToMap(
                conflictStats?.newDisplacementTimeseriesByYear,
                (item) => item.year,
                (item) => item.total,
            );
            return [
                timeRangeArray.map((year) => ({
                    year,
                    conflict: conflictDataByYear?.[year],
                    disaster: disasterDataByYear?.[year],
                })),
                [
                    isDisasterDataShown ? {
                        dataKey: 'disaster',
                        key: 'disaster',
                        stackId: 'total',
                        fill: 'var(--color-disaster)',
                        name: 'disaster',
                    } : undefined,
                    isConflictDataShown ? {
                        dataKey: 'conflict',
                        key: 'conflict',
                        stackId: 'total',
                        fill: 'var(--color-conflict)',
                        name: 'conflict',
                    } : undefined,
                ].filter(isDefined),
            ];
        }
        if (causeChartType === 'compare' && !showCombinedCountries) {
            const disasterDataByCountries = Object.values(listToGroupList(
                disasterStats?.totalDisplacementTimeseriesByCountry ?? [],
                (item) => item.country.id,
                (item) => ({
                    year: Number(item.year),
                    [`disaster-${item.country.iso3}`]: item.total,
                }),
            )).flat();
            const conflictDataByCountries = Object.values(listToGroupList(
                conflictStats?.totalDisplacementTimeseriesByCountry ?? [],
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
                    isDisasterDataShown ? {
                        dataKey: `disaster-${country}`,
                        key: `disaster-${country}`,
                        stackId: `total-${country}`,
                        fill: disasterColorsRange[index],
                        name: `${country} Disaster`,
                    } : undefined,
                    isConflictDataShown ? {
                        dataKey: `conflict-${country}`,
                        key: `conflict-${country}`,
                        stackId: `total-${country}`,
                        fill: conflictColorsRange[index],
                        name: `${country} Conflict`,
                    } : undefined,
                ])).filter(isDefined),
            ];
        }
        if (causeChartType === 'combine' && !showCombinedCountries) {
            const timeRangeByCountry = timeRangeArray.flatMap((year) => (
                countries.map((country) => (`${year}-${country}`))
            ));
            const disasterDataByCountries = listToMap(
                disasterStats?.totalDisplacementTimeseriesByCountry ?? [],
                (item) => `${item.year}-${item.country.iso3}` as string,
                (item) => ({
                    year: Number(item.year),
                    countryName: item.country.countryName,
                    iso3: item.country.iso3,
                    total: item.total,
                }),
            );
            const conflictDataByCountries = listToMap(
                conflictStats?.totalDisplacementTimeseriesByCountry ?? [],
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
                    isDisasterDataShown ? disasterDataByCountries[year]?.total : undefined,
                    isConflictDataShown ? conflictDataByCountries[year]?.total : undefined,
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
        isConflictDataShown,
        isDisasterDataShown,
        conflictStats,
        disasterStats,
        countries,
        countriesChartType,
        timeRangeArray,
        causeChartType,
    ]);

    const giddDisplacementsVariables = useMemo(() => ({
        ordering: `${sorting?.direction === 'asc' ? '' : '-'}${sorting?.name}`,
        page: activePage,
        pageSize: DISPLACEMENTS_TABLE_PAGE_SIZE,
        releaseEnvironment: DATA_RELEASE,
    }), [
        sorting,
        activePage,
    ]);

    const {
        previousData: previousDisplacementsResponse,
        data: displacementsResponse = previousDisplacementsResponse,
    } = useQuery<
        GiddDisplacementsQuery,
        GiddDisplacementsQueryVariables
    >(
        GIDD_DISPLACEMENTS,
        {
            variables: giddDisplacementsVariables,
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

    const columns = useMemo(
        () => ([
            createTextColumn<DisplacementData, string>(
                'countryName',
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
                'conflictNewDisplacements',
                'Conflict Internal Displacement',
                (item) => item.conflictNewDisplacement,
                {
                    sortable: true,
                    variant: 'conflict',
                },
            ) : undefined,
            isConflictDataShown ? createNumberColumn<DisplacementData, string>(
                'conflictTotalDisplacement',
                'Conflict Total number of IDPs',
                (item) => item.conflictTotalDisplacement,
                {
                    sortable: true,
                    variant: 'conflict',
                },
            ) : undefined,
            isDisasterDataShown ? createNumberColumn<DisplacementData, string>(
                'disasterNewDisplacement',
                'Disaster Internal Displacement',
                (item) => item.disasterNewDisplacement,
                {
                    sortable: true,
                    variant: 'disaster',
                },
            ) : undefined,
            isDisasterDataShown ? createNumberColumn<DisplacementData, string>(
                'disasterTotalDisplacement',
                'Disaster Total number of IDPs',
                (item) => item.disasterTotalDisplacement,
                {
                    sortable: true,
                    variant: 'disaster',
                },
            ) : undefined,
            createNumberColumn<DisplacementData, string>(
                'totalNewDisplacement',
                'Total Internal Displacement',
                (item) => item.totalNewDisplacement,
                { sortable: true },
            ),
            createNumberColumn<DisplacementData, string>(
                'totalInternalDisplacement',
                'Total number of IDPS',
                (item) => item.totalInternalDisplacement,
                { sortable: true },
            ),
        ]).filter(isDefined),
        [
            isConflictDataShown,
            isDisasterDataShown,
        ],
    );

    const sortedHazards = useMemo(() => (
        disasterStats?.displacementsByHazardType?.sort(
            (foo, bar) => compareNumber(foo.newDisplacements, bar.newDisplacements, -1),
        )), [disasterStats?.displacementsByHazardType]);

    const hazardRendererParams = useCallback((_: string, hazard: HazardData) => ({
        total: sortedHazards?.[0]?.newDisplacements ?? undefined,
        value: hazard.newDisplacements ?? undefined,
        hazardType: hazard.label,
        icon: (
            <DisplacementIcon
                displacementType="Disaster"
                disasterType={hazard.label}
            />
        ),
        title: hazard.label,
    }), [sortedHazards]);

    const stockTotal = sumAndRemoveZero([
        conflictStats?.totalDisplacements,
        disasterStats?.totalDisplacements,
    ]);

    const totalCountries = Math.max(
        conflictStats?.totalCountries ?? 0,
        disasterStats?.totalCountries ?? 0,
    );

    const flowTotal = sumAndRemoveZero([
        conflictStats?.newDisplacements,
        disasterStats?.newDisplacements,
    ]);

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
                                    subLabel={`In ${totalCountries} countries and territories`}
                                    value={stockTotal}
                                />
                            )}
                            <div className={styles.causesBlock}>
                                {isConflictDataShown && (
                                    <NumberBlock
                                        label="Total by Conflict and Violence"
                                        size={displacementCause ? 'large' : 'medium'}
                                        variant="conflict"
                                        subLabel={`In ${conflictStats?.totalCountries} countries and territories`}
                                        value={conflictStats?.totalDisplacements}
                                    />
                                )}
                                {isDisasterDataShown && (
                                    <NumberBlock
                                        label="Total by Disasters"
                                        size={displacementCause ? 'large' : 'medium'}
                                        variant="disaster"
                                        subLabel={`In ${disasterStats?.totalCountries} countries and territories`}
                                        value={disasterStats?.totalDisplacements}
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
                                        value={disasterStats?.totalEvents}
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
                                    subLabel={`In ${totalCountries} countries and territories`}
                                    value={flowTotal}
                                />
                            )}
                            <div className={styles.causesBlock}>
                                {isConflictDataShown && (
                                    <NumberBlock
                                        label="Total by Conflict and Violence"
                                        variant="conflict"
                                        size={displacementCause ? 'large' : 'medium'}
                                        subLabel={`In ${conflictStats?.totalCountries} countries and territories`}
                                        value={conflictStats?.newDisplacements}
                                    />
                                )}
                                {isDisasterDataShown && (
                                    <NumberBlock
                                        label="Total by Disasters"
                                        size={displacementCause ? 'large' : 'medium'}
                                        variant="disaster"
                                        subLabel={`In ${disasterStats?.totalCountries} countries and territories`}
                                        value={disasterStats?.newDisplacements}
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
                            itemsCount={displacementsResponse?.giddDisplacements?.totalCount ?? 0}
                            maxItemsPerPage={DISPLACEMENTS_TABLE_PAGE_SIZE}
                            onActivePageChange={setActivePage}
                            itemsPerPageControlHidden
                        />
                        <Table
                            className={styles.table}
                            keySelector={displacementItemKeySelector}
                            data={displacementsResponse?.giddDisplacements?.results}
                            columns={columns}
                        />
                    </SortContext.Provider>
                </div>
                {displacementCause === 'disaster' && (
                    <EventsTable />
                )}
            </div>
        </div>
    );
}
export default Gidd;
