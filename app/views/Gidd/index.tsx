import React, { useMemo, useCallback, useState } from 'react';
import {
    _cs,
    compareString,
    isNotDefined,
    listToMap,
    listToGroupList,
    isDefined,
    compareNumber,
} from '@togglecorp/fujs';
import {
    Switch,
    SelectInput,
    MultiSelectInput,
    List,
} from '@togglecorp/toggle-ui';
import { removeNull } from '@togglecorp/toggle-form';
import {
    formatNumber,
    START_YEAR,
    sumAndRemoveZero,
    DATA_RELEASE,
    roundAndRemoveZero,
    getHazardTypeLabel,
    suffixHelixRestEndpoint,
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

import ButtonLikeLink from '#components/ButtonLikeLink';
import ErrorBoundary from '#components/ErrorBoundary';
import SliderInput from '#components/SliderInput';
import Header from '#components/Header';
import Button from '#components/Button';
import ProgressLine from '#components/ProgressLine';
import NumberBlock from '#components/NumberBlock';
import Tabs from '#components/Tabs';
import Tab from '#components/Tabs/Tab';
import TabList from '#components/Tabs/TabList';
import TabPanel from '#components/Tabs/TabPanel';
import GridFilterInputContainer from '#components/GridFilterInputContainer';
import useDebouncedValue from '#hooks/useDebouncedValue';
import DisplacementIcon from '#components/DisplacementIcon';
import {
    GiddFilterOptionsQuery,
    GiddFilterOptionsQueryVariables,
    GiddStatisticsQuery,
    GiddStatisticsQueryVariables,
} from '#generated/types';

import EventsTable from './EventsTable';
import DataTable from './DataTable';

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

const chartMargins = { top: 16, left: 0, right: 0, bottom: 5 };

const mainText = 'IDMC Data Portal enables you to explore, filter and sort our data to produce your own graphs and tables. You can also access and export the data used to generate these visualisations.';
const downloadText = 'You can export your data, either the full dataset or the result of your query in an Excel format which includes the metadata and copyrights.';
const flowDetails = 'The internal displacements figure refers to the number of forced movements of people within the borders of their country recorded during the year. Figures may include individuals who have been displaced more than once.';
const stockDetails = 'The total number of Internally Displaced People (IDPs) is a snapshot of all the people living in internal displacements at the end of the year.';

type HazardData = NonNullable<NonNullable<GiddStatisticsQuery['giddDisasterStatistics']>['displacementsByHazardType']>[number];

const hazardKeySelector = (item: HazardData) => item.id;

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
        giddHazardTypes {
            id
            name
        }
    }
`;

const GIDD_STATISTICS = gql`
    query GiddStatistics(
        $countriesIso3: [String!],
        $hazardTypes: [ID!],
        $endYear: Float,
        $startYear: Float,
        $endYearForTimeseries: Float,
        $startYearForTimeseries: Float,
        $releaseEnvironment: String!,
        $combineCountries: Boolean!,
    ){
        giddConflictStatistics(
            countriesIso3: $countriesIso3,
            endYear: $endYear,
            startYear: $startYear,
            releaseEnvironment: $releaseEnvironment,
        ) {
            totalDisplacements
            newDisplacements
            totalCountries
        }
        giddDisasterStatistics(
            hazardTypes: $hazardTypes,
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
            newDisplacements
            totalDisplacements
            totalCountries
            totalEvents
        }
        giddConflictTimeseries: giddConflictStatistics(
            countriesIso3: $countriesIso3,
            endYear: $endYearForTimeseries,
            startYear: $startYearForTimeseries,
            releaseEnvironment: $releaseEnvironment,
        ) {
            totalDisplacementTimeseriesByYear @include(if: $combineCountries) {
                total
                year
            }
            newDisplacementTimeseriesByYear @include(if: $combineCountries) {
                total
                year
            }
            totalDisplacementTimeseriesByCountry @skip(if: $combineCountries) {
                country {
                    countryName
                    id
                    iso3
                }
                total
                year
            }
            newDisplacementTimeseriesByCountry @skip(if: $combineCountries) {
                country {
                    countryName
                    id
                    iso3
                }
                total
                year
            }
        }
        giddDisasterTimeseries: giddDisasterStatistics(
            hazardTypes: $hazardTypes,
            countriesIso3: $countriesIso3,
            endYear: $endYearForTimeseries,
            startYear: $startYearForTimeseries,
            releaseEnvironment: $releaseEnvironment,
        ) {
            totalDisplacementTimeseriesByYear @include(if: $combineCountries) {
                total
                year
            }
            newDisplacementTimeseriesByYear @include(if: $combineCountries) {
                total
                year
            }
            totalDisplacementTimeseriesByCountry @skip(if: $combineCountries) {
                country {
                    countryName
                    id
                    iso3
                }
                total
                year
            }
            newDisplacementTimeseriesByCountry @skip(if: $combineCountries) {
                country {
                    countryName
                    id
                    iso3
                }
                total
                year
            }
        }
        giddConflictLatestYearFigures: giddConflictStatistics(
            countriesIso3: $countriesIso3,
            endYear: $endYear,
            startYear: $endYear,
            releaseEnvironment: $releaseEnvironment,
        ) {
            totalDisplacements,
            newDisplacements,
            totalCountries
        }
        giddDisasterLatestYearFigures: giddDisasterStatistics(
            countriesIso3: $countriesIso3,
            endYear: $endYear,
            startYear: $endYear,
            releaseEnvironment: $releaseEnvironment,
        ) {
            totalDisplacements,
            newDisplacements,
            totalCountries
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

function hazardLabelSelector(d: { id: string, name: string }) {
    return getHazardTypeLabel({ id: d.id, label: d.name });
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
        label: 'Conflict and violence',
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
        label: 'Internal Displacements',
    },
    {
        key: 'stock',
        label: 'Total Number of IDPs',
    },
];

export interface Props {
    endYear: number;
}

function Gidd(props: Props) {
    const { endYear } = props;

    const [timeRange, setTimeRange] = useState([endYear, endYear]);
    const [displacementCause, setDisplacementCause] = useState<Cause | undefined>();
    const [combineCauseCharts, setCombineCauseCharts] = useState(false);
    const [displacementCategory, setDisplacementCategory] = useState<Category | undefined>();
    const [selectedTable, setSelectedTable] = useState<'events' | 'data'>('data');
    const [disasterFiltersShown, setDisasterFilterVisibility] = useState(false);
    const [combineCountriesChart, setCombineCountriesChart] = useState(false);
    const [dataActivePage, setDataActivePage] = useState<number>(1);
    const [eventsActivePage, setEventsActivePage] = useState<number>(1);
    const [
        countries,
        setCountries,
    ] = useState<string[]>([]);
    const [
        hazardTypes,
        setHazardTypes,
    ] = useState<string[]>([]);

    const handleCauseChange = useCallback((newVal: Cause | undefined) => {
        setDisplacementCause(newVal);

        if (newVal === 'conflict' || newVal === undefined) {
            setHazardTypes([]);
        }

        if (newVal) {
            setCombineCauseCharts(false);
        }
    }, [
        setHazardTypes,
    ]);

    const handleCountriesChange = useCallback((newVal: string[]) => {
        setCountries(newVal);

        if (newVal.length === 0 || newVal.length > 3) {
            setCombineCountriesChart(false);
        }
        setDataActivePage(1);
        setEventsActivePage(1);
    }, [setCountries]);

    const handleTimeRangeChange = useCallback((newVal: number[]) => {
        setTimeRange(newVal);
        setDataActivePage(1);
        setEventsActivePage(1);
    }, []);

    const handleResetQueryClick = useCallback(() => {
        handleCountriesChange([]);
        setHazardTypes([]);
        handleCauseChange(undefined);
        setTimeRange([endYear, endYear]);
        setDisplacementCategory(undefined);
        setDataActivePage(1);
        setEventsActivePage(1);
    }, [
        handleCauseChange,
        handleCountriesChange,
        setHazardTypes,
        endYear,
    ]);

    const domainForCharts = useMemo(() => {
        if (timeRange[0] === timeRange[1]) {
            return [START_YEAR, timeRange[0]];
        }
        return timeRange;
    }, [timeRange]);

    const timeRangeArray = useMemo(() => (
        Array.from(
            { length: (domainForCharts[1] - domainForCharts[0]) + 1 },
            (_, index) => domainForCharts[0] + index,
        )
    ), [domainForCharts]);

    const isDisasterDataShown = displacementCause === 'disaster' || isNotDefined(displacementCause);
    const isConflictDataShown = displacementCause === 'conflict' || isNotDefined(displacementCause);

    const {
        previousData: previousCountryFilterData,
        data: countryFilterResponse = previousCountryFilterData,
    } = useQuery<
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

    const showCombinedCountries = combineCountriesChart
        || countries.length > 3 || countries.length === 0;

    const statisticsVariables = useMemo(() => ({
        countriesIso3: countries,
        combineCountries: showCombinedCountries,
        hazardTypes: displacementCause === 'disaster' ? hazardTypes : undefined,
        startYear: timeRange[0],
        endYear: timeRange[1],
        startYearForTimeseries: timeRange[0] === timeRange[1] ? START_YEAR : timeRange[0],
        endYearForTimeseries: timeRange[1],
        releaseEnvironment: DATA_RELEASE,
    }), [
        displacementCause,
        hazardTypes,
        showCombinedCountries,
        timeRange,
        countries,
    ]);

    const debouncedStatisticsVariables = useDebouncedValue(statisticsVariables);

    const {
        previousData: previousStatisticsData,
        data: statisticsResponse = previousStatisticsData,
    } = useQuery<GiddStatisticsQuery, GiddStatisticsQueryVariables>(
        GIDD_STATISTICS,
        {
            variables: debouncedStatisticsVariables,
            context: {
                clientName: 'helix',
            },
        },
    );

    const conflictStats = removeNull(statisticsResponse?.giddConflictStatistics);
    const disasterStats = removeNull(statisticsResponse?.giddDisasterStatistics);
    const latestConflictStats = removeNull(statisticsResponse?.giddConflictLatestYearFigures);
    const latestDisasterStats = removeNull(statisticsResponse?.giddDisasterLatestYearFigures);
    const conflictChartData = removeNull(statisticsResponse?.giddConflictTimeseries);
    const disasterChartData = removeNull(statisticsResponse?.giddDisasterTimeseries);

    const [
        stockTimeseries,
        lineConfigs,
    ] = useMemo(() => {
        if (combineCauseCharts && showCombinedCountries) {
            const disasterDataByYear = listToMap(
                disasterChartData?.totalDisplacementTimeseriesByYear,
                (item) => item.year,
                (item) => item.total,
            );
            const conflictDataByYear = listToMap(
                conflictChartData?.totalDisplacementTimeseriesByYear,
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
                        name: 'Total',
                    },
                ],
            ];
        }
        if (!combineCauseCharts && showCombinedCountries) {
            const timeseries = [
                ...(conflictChartData?.totalDisplacementTimeseriesByYear?.map((item) => ({
                    year: item.year,
                    conflict: item.total,
                })) ?? []),
                ...(disasterChartData?.totalDisplacementTimeseriesByYear?.map((item) => ({
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
                        name: 'Disaster',
                    } : undefined,
                    isConflictDataShown ? {
                        dataKey: 'conflict',
                        key: 'conflict',
                        stackId: 'total',
                        fill: 'var(--color-conflict)',
                        name: 'Conflict',
                    } : undefined,
                ].filter(isDefined),
            ];
        }
        if (!combineCauseCharts && !showCombinedCountries) {
            const disasterDataByCountries = Object.values(listToGroupList(
                disasterChartData?.totalDisplacementTimeseriesByCountry ?? [],
                (item) => item.country.id,
                (item) => ({
                    iso3: item.country.iso3,
                    countryName: item.country.countryName,
                    year: Number(item.year),
                    [`disaster-${item.country.iso3}`]: item.total,
                }),
            )).flat();
            const conflictDataByCountries = Object.values(listToGroupList(
                conflictChartData?.totalDisplacementTimeseriesByCountry ?? [],
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
        if (combineCauseCharts && !showCombinedCountries) {
            const timeRangeByCountry = timeRangeArray.flatMap((year) => (
                countries.map((country) => `${year}-${country}`)
            ));
            const disasterDataByCountries = listToMap(
                disasterChartData?.totalDisplacementTimeseriesByCountry ?? [],
                (item) => `${item.year}-${item.country.iso3}` as string,
                (item) => ({
                    year: Number(item.year),
                    countryName: item.country.countryName,
                    iso3: item.country.iso3,
                    total: item.total,
                }),
            );
            const conflictDataByCountries = listToMap(
                conflictChartData?.totalDisplacementTimeseriesByCountry ?? [],
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
        conflictChartData,
        disasterChartData,
        countries,
        timeRangeArray,
        combineCauseCharts,
        showCombinedCountries,
    ]);

    const [
        flowTimeseries,
        barConfigs,
    ] = useMemo(() => {
        if (combineCauseCharts && showCombinedCountries) {
            const disasterDataByYear = listToMap(
                disasterChartData?.newDisplacementTimeseriesByYear,
                (item) => item.year,
                (item) => item.total,
            );
            const conflictDataByYear = listToMap(
                conflictChartData?.newDisplacementTimeseriesByYear,
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
                        name: 'Total',
                    },
                ],
            ];
        }
        if (!combineCauseCharts && showCombinedCountries) {
            const disasterDataByYear = listToMap(
                disasterChartData?.newDisplacementTimeseriesByYear,
                (item) => item.year,
                (item) => item.total,
            );
            const conflictDataByYear = listToMap(
                conflictChartData?.newDisplacementTimeseriesByYear,
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
                        name: 'Disaster',
                    } : undefined,
                    isConflictDataShown ? {
                        dataKey: 'conflict',
                        key: 'conflict',
                        stackId: 'total',
                        fill: 'var(--color-conflict)',
                        name: 'Conflict',
                    } : undefined,
                ].filter(isDefined),
            ];
        }
        if (!combineCauseCharts && !showCombinedCountries) {
            const disasterDataByCountries = Object.values(listToGroupList(
                disasterChartData?.newDisplacementTimeseriesByCountry ?? [],
                (item) => item.country.id,
                (item) => ({
                    year: Number(item.year),
                    [`disaster-${item.country.iso3}`]: item.total,
                }),
            )).flat();
            const conflictDataByCountries = Object.values(listToGroupList(
                conflictChartData?.newDisplacementTimeseriesByCountry ?? [],
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
        if (combineCauseCharts && !showCombinedCountries) {
            const timeRangeByCountry = timeRangeArray.flatMap((year) => (
                countries.map((country) => (`${year}-${country}`))
            ));
            const disasterDataByCountries = listToMap(
                disasterChartData?.newDisplacementTimeseriesByCountry ?? [],
                (item) => `${item.year}-${item.country.iso3}` as string,
                (item) => ({
                    year: Number(item.year),
                    countryName: item.country.countryName,
                    iso3: item.country.iso3,
                    total: item.total,
                }),
            );
            const conflictDataByCountries = listToMap(
                conflictChartData?.newDisplacementTimeseriesByCountry ?? [],
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
        conflictChartData,
        disasterChartData,
        countries,
        timeRangeArray,
        combineCauseCharts,
        showCombinedCountries,
    ]);

    const countriesOptions = removeNull(
        [...(countryFilterResponse?.giddPublicCountries ?? [])]?.sort(
            (foo, bar) => compareString(foo.idmcShortName, bar.idmcShortName),
        ),
    )?.filter(isDefined);

    const hazardOptions = removeNull(
        countryFilterResponse?.giddHazardTypes,
    )?.filter(isDefined);

    const sortedHazards = useMemo(
        () => ([...(disasterStats?.displacementsByHazardType ?? [])].sort(
            (foo, bar) => compareNumber(foo.newDisplacements, bar.newDisplacements, -1),
        )),
        [disasterStats?.displacementsByHazardType],
    );

    const maxDisplacementValue = sortedHazards[0]?.newDisplacements ?? undefined;

    const handleAdditionalFiltersChange = useCallback((newVal) => {
        if (newVal) {
            handleCauseChange('disaster');
        }
        setDisasterFilterVisibility(newVal);
    }, [
        handleCauseChange,
    ]);

    const hazardRendererParams = useCallback((_: string, hazard: HazardData) => ({
        total: maxDisplacementValue,
        value: roundAndRemoveZero(hazard.newDisplacements ?? undefined),
        // hazardType: getHazardTypeLabel(hazard),
        icon: (
            <DisplacementIcon
                displacementType="Disaster"
                disasterType={getHazardTypeLabel(hazard)}
            />
        ),
        title: getHazardTypeLabel(hazard),
    }), [maxDisplacementValue]);

    const stockTotal = sumAndRemoveZero([
        latestConflictStats?.totalDisplacements,
        latestDisasterStats?.totalDisplacements,
    ]);

    // FIXME: remove this
    const totalCountries = Math.max(
        conflictStats?.totalCountries ?? 0,
        disasterStats?.totalCountries ?? 0,
    );

    const flowTotal = sumAndRemoveZero([
        conflictStats?.newDisplacements,
        disasterStats?.newDisplacements,
    ]);

    const chartTypeSelection = (
        <div className={styles.chartTypeContainer}>
            {isNotDefined(displacementCause) && (
                <Switch
                    className={styles.switch}
                    labelClassName={styles.switchLabel}
                    checkmarkClassName={styles.knob}
                    name="combineCauseCharts"
                    value={combineCauseCharts}
                    onChange={setCombineCauseCharts}
                    label="Combine conflict and violence and disasters"
                />
            )}
            {countries.length > 1 && countries.length <= 3 && (
                <Switch
                    className={styles.switch}
                    labelClassName={styles.switchLabel}
                    checkmarkClassName={styles.knob}
                    name="combineCountriesChart"
                    value={combineCountriesChart}
                    onChange={setCombineCountriesChart}
                    label="Combine locations"
                />
            )}
        </div>
    );

    return (
        <div className={styles.bodyContainer}>
            <div className={styles.gidd}>
                <div className={styles.filterContainer}>
                    <Header
                        heading="IDMC Data Portal"
                        actions={(
                            <Button
                                className={styles.resetButton}
                                name="resetQuery"
                                onClick={handleResetQueryClick}
                                variant="transparent"
                            >
                                Reset Query
                            </Button>
                        )}
                        darkMode
                    />
                    <div className={styles.filterBodyContainer}>
                        <div className={_cs(styles.filterSection, styles.leftSection)}>
                            <p className={styles.headingDescription}>{mainText}</p>
                            <div className={styles.downloadSection}>
                                <p className={styles.downloadDescription}>{downloadText}</p>
                                {displacementCause === 'disaster' ? (
                                    <ButtonLikeLink
                                        href={suffixHelixRestEndpoint(`/gidd/disasters/disaster-export/?iso3__in=${countries.join(',')}&start_year=${timeRange[0]}&end_year=${timeRange[1]}&hazard_type__in=${hazardTypes.join(',')}`)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Download Dataset
                                    </ButtonLikeLink>
                                ) : (
                                    <ButtonLikeLink
                                        href={suffixHelixRestEndpoint(`/gidd/displacements/displacement-export/?cause=${displacementCause}&iso3__in=${countries.join(',')}&start_year=${timeRange[0]}&end_year=${timeRange[1]}`)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Download Dataset
                                    </ButtonLikeLink>
                                )}
                            </div>
                        </div>
                        <div className={styles.right}>
                            <div className={styles.top}>
                                <div className={_cs(styles.filterSection)}>
                                    <GridFilterInputContainer
                                        label="Internal Displacements or Total Number of IDPs"
                                        helpText="Select internal displacements or total number of IDPs"
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
                                        label="Countries, and/or Territories"
                                        labelDescription="*In compared view, up to 3 countries or territories can be selected"
                                        input={(
                                            <MultiSelectInput
                                                name="country"
                                                className={styles.selectInput}
                                                value={countries}
                                                options={countriesOptions}
                                                keySelector={countryKeySelector}
                                                labelSelector={nameSelector}
                                                onChange={handleCountriesChange}
                                                inputSectionClassName={styles.inputSection}
                                            />
                                        )}
                                    />
                                </div>
                                <div className={_cs(styles.filterSection)}>
                                    <GridFilterInputContainer
                                        label="Conflict and Violence or Disaster"
                                        input={(
                                            <SelectInput
                                                name="cause"
                                                className={styles.selectInput}
                                                inputSectionClassName={styles.inputSection}
                                                keySelector={causeKeySelector}
                                                labelSelector={causeLabelSelector}
                                                value={displacementCause}
                                                onChange={handleCauseChange}
                                                options={displacementCauseOptions}
                                            />
                                        )}
                                    />
                                    <GridFilterInputContainer
                                        label={`Timescale ${`${timeRange[0]} - ${timeRange[1]}`}`}
                                        input={(
                                            <SliderInput
                                                className={_cs(styles.sliderInput, styles.input)}
                                                hideValues
                                                min={START_YEAR}
                                                max={endYear}
                                                step={1}
                                                minDistance={0}
                                                value={timeRange}
                                                onChange={handleTimeRangeChange}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                            <Switch
                                className={styles.switch}
                                labelClassName={styles.switchLabel}
                                name="additionalFilters"
                                value={displacementCause === 'disaster' && disasterFiltersShown}
                                onChange={handleAdditionalFiltersChange}
                                label="Additional Disaster Filters"
                            />
                            {disasterFiltersShown && displacementCause === 'disaster' && (
                                <div className={styles.disasterFilters}>
                                    <GridFilterInputContainer
                                        label="Disaster Hazard Type"
                                        input={(
                                            <MultiSelectInput
                                                name="disasterHazard"
                                                className={styles.selectInput}
                                                value={hazardTypes}
                                                options={hazardOptions ?? undefined}
                                                keySelector={idSelector}
                                                labelSelector={hazardLabelSelector}
                                                onChange={setHazardTypes}
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
                        <div
                            className={_cs(
                                styles.statBox,
                                !isConflictDataShown && styles.disasterStatBox,
                                isDefined(displacementCategory) && styles.onlyOneSelected,
                            )}
                        >
                            <div className={styles.topStats}>
                                <Header
                                    heading="Internal Displacements"
                                    headingSize="medium"
                                    headingTooltip={flowDetails}
                                />
                                {!displacementCause && (
                                    <NumberBlock
                                        label="Total"
                                        size="large"
                                        subLabel={totalCountries === 1 ? 'In 1 country and territory' : `In ${totalCountries} countries and territories`}
                                        value={flowTotal}
                                    />
                                )}
                                <div className={styles.causesBlock}>
                                    {isConflictDataShown && (
                                        <NumberBlock
                                            label="Total by conflict and violence"
                                            size={displacementCause ? 'large' : 'medium'}
                                            variant="conflict"
                                            subLabel={conflictStats?.totalCountries === 1 ? 'In 1 country and territory' : `In ${conflictStats?.totalCountries ?? 0} countries and territories`}
                                            value={conflictStats?.newDisplacements}
                                        />
                                    )}
                                    {isDisasterDataShown && (
                                        <NumberBlock
                                            label="Total by disasters"
                                            size={displacementCause ? 'large' : 'medium'}
                                            variant="disaster"
                                            subLabel={disasterStats?.totalCountries === 1 ? 'In 1 country and territory' : `In ${disasterStats?.totalCountries ?? 0} countries and territories`}
                                            value={disasterStats?.newDisplacements}
                                        />
                                    )}
                                </div>
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
                                                    allowDecimals={false}
                                                    type="number"
                                                    domain={domainForCharts}
                                                    padding={{ left: 20, right: 20 }}
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
                                                        maxBarSize={6}
                                                        dataKey={barConfig.dataKey}
                                                        stackId={barConfig.stackId}
                                                        key={barConfig.key}
                                                        fill={barConfig.fill}
                                                        name={barConfig.name}
                                                    />
                                                ))}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ErrorBoundary>
                                </div>
                                {chartTypeSelection}
                            </div>
                            {displacementCause === 'disaster' && (
                                <div className={styles.disasterStats}>
                                    <NumberBlock
                                        label=""
                                        size="medium"
                                        variant="disaster"
                                        subLabel="Disaster Events Reported"
                                        value={disasterStats?.totalEvents}
                                    />
                                    <List
                                        rendererParams={hazardRendererParams}
                                        renderer={ProgressLine}
                                        keySelector={hazardKeySelector}
                                        data={sortedHazards}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    {displacementCategory !== 'flow' && (
                        <div
                            className={_cs(
                                styles.statBox,
                                isDefined(displacementCategory) && styles.onlyOneSelected,
                            )}
                        >
                            <Header
                                heading="Internally displaced people (IDPs)"
                                headingTooltip={stockDetails}
                                headingSize="medium"
                            />
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
                                        variant="conflict"
                                        size={displacementCause ? 'large' : 'medium'}
                                        subLabel={`In ${latestConflictStats?.totalCountries ?? 0} countries and territories`}
                                        value={latestConflictStats?.totalDisplacements}
                                    />
                                )}
                                {isDisasterDataShown && (
                                    <NumberBlock
                                        label="Total by Disasters"
                                        size={displacementCause ? 'large' : 'medium'}
                                        variant="disaster"
                                        subLabel={`In ${latestDisasterStats?.totalCountries ?? 0} countries and territories`}
                                        value={latestDisasterStats?.totalDisplacements}
                                    />
                                )}
                            </div>
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
                                                padding={{ left: 20, right: 20 }}
                                                allowDecimals={false}
                                                domain={domainForCharts}
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
                                        </LineChart>
                                    </ResponsiveContainer>
                                </ErrorBoundary>
                            </div>
                            {chartTypeSelection}
                        </div>
                    )}
                </div>
                <div className={styles.tableContainer}>
                    <Tabs
                        value={displacementCause === 'disaster' ? selectedTable : 'data'}
                        onChange={setSelectedTable}
                        variant="primary"
                    >
                        <Header
                            className={styles.header}
                            headingSize="small"
                            heading={(
                                <TabList
                                    position="left"
                                    gap
                                >
                                    <Tab name="data">
                                        Data Table
                                    </Tab>
                                    {displacementCause === 'disaster' && (
                                        <Tab name="events">
                                            Events Table
                                        </Tab>
                                    )}
                                </TabList>
                            )}
                        />
                        <div className={styles.tabPanels}>
                            <TabPanel name="data">
                                <DataTable
                                    isConflictDataShown={isConflictDataShown}
                                    isDisasterDataShown={isDisasterDataShown}
                                    countriesIso3={countries}
                                    startYear={timeRange[0]}
                                    endYear={timeRange[1]}
                                    activePage={dataActivePage}
                                    onActivePageChange={setDataActivePage}
                                />
                            </TabPanel>
                            {displacementCause === 'disaster' && (
                                <TabPanel name="events">
                                    <EventsTable
                                        activePage={eventsActivePage}
                                        onActivePageChange={setEventsActivePage}
                                        countriesIso3={countries}
                                        hazardTypes={hazardTypes}
                                        startYear={timeRange[0]}
                                        endYear={timeRange[1]}
                                    />
                                </TabPanel>
                            )}
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
export default Gidd;
