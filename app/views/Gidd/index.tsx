import React, {
    useMemo,
    useCallback,
    useState,
    useEffect,
} from 'react';
import {
    _cs,
    compareString,
    isNotDefined,
    listToMap,
    listToGroupList,
    isDefined,
    compareNumber,
    sum,
} from '@togglecorp/fujs';
import {
    Switch,
    SelectInput,
    MultiSelectInput,
    SegmentInput,
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    IoSearchOutline,
    IoFilterOutline,
    IoChevronDownOutline,
    IoChevronUpOutline,
    IoRefreshOutline,
} from 'react-icons/io5';
import { removeNull } from '@togglecorp/toggle-form';
import {
    formatNumber,
    START_YEAR,
    sumAndRemoveZero,
    DATA_RELEASE,
    getHazardTypeLabel,
    isDisaggregationAvailable,
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
import Header from '#components/Header';
import NumberBlock from '#components/NumberBlock';
import RawButton from '#components/RawButton';
import SlideCarousel from '#components/SlideCarousel';
import FilterPill from '#components/IduMap/FilterPill';
import useDebouncedValue from '#hooks/useDebouncedValue';
import useDocumentSize from '#hooks/useDocumentSize';
import Message from '#components/Message';
import {
    GiddFilterOptionsQuery,
    GiddFilterOptionsQueryVariables,
    GiddStatisticsQuery,
    GiddStatisticsQueryVariables,
} from '#generated/types';

import useYear from '#hooks/useYear';
import EventsTable from './EventsTable';
import DataTable from './DataTable';
import DownloadMenu from './DownloadMenu';
import GiddMap from './GiddMap';
import HazardBreakdownCard from './HazardBreakdownCard';
import LargestEventsCard from './LargestEventsCard';
import FigureAnalysisCard from './FigureAnalysisCard';

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

function getCountryCountSubLabel(count = 0) {
    if (count === 1) {
        return 'In 1 country and territory';
    }
    return `In ${count} countries and territories`;
}

function getCountryStockCountSubLabel(count = 0, year: number) {
    if (count === 1) {
        return `In 1 country and territory as of ${year}`;
    }
    return `In ${count} countries and territories as of ${year}`;
}

const headingText = 'Global Internal Displacement Database (GIDD)';
const mainText = 'Explore the GIDD, IDMC’s global repository of internal displacement data, covering 2008 to the present.';
const downloadText = 'Downloadable data files include metadata, copyright details, and methodological notes.';
const flowDetails = 'The internal displacements figure refers to the number of forced movements of people within the borders of their country recorded during the year. Figures may include individuals who have been displaced more than once.';
const stockDetails = 'The total number of Internally Displaced People (IDPs) is a snapshot of all the people living in internal displacements at the end of the year.';

const GIDD_FILTER_OPTIONS = gql`
    query GiddFilterOptions(
        $clientId: String!,
    ) {
        giddPublicCountries(
            clientId: $clientId,
        ) {
            id
            idmcShortName
            iso3
            region {
                id
                name
            }
        }
        giddPublicHazardTypes(
            clientId: $clientId,
        ) {
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
        $clientId: String!,
    ){
        giddPublicCombinedStatistics(
            countriesIso3: $countriesIso3,
            endYear: $endYear,
            startYear: $startYear,
            releaseEnvironment: $releaseEnvironment,
            hazardTypes: $hazardTypes,
            clientId: $clientId,
        ) {
            internalDisplacementsRounded
            totalDisplacementsRounded
            internalDisplacementCountries
            totalDisplacementCountries
        }
        giddPublicConflictStatistics(
            countriesIso3: $countriesIso3,
            endYear: $endYear,
            startYear: $startYear,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ) {
            totalDisplacementsRounded
            totalDisplacementCountries
            newDisplacementsRounded
            internalDisplacementCountries
        }
        giddPublicDisasterStatistics(
            hazardTypes: $hazardTypes,
            countriesIso3: $countriesIso3,
            endYear: $endYear,
            startYear: $startYear,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ){
            newDisplacementsRounded
            totalDisplacementsRounded
            totalDisplacementCountries
            internalDisplacementCountries
            displacementsByHazardType {
                id
                label
                newDisplacementsRounded
            }
            totalEvents
        }
        giddConflictTimeseries: giddPublicConflictStatistics(
            countriesIso3: $countriesIso3,
            endYear: $endYearForTimeseries,
            startYear: $startYearForTimeseries,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ) {
            totalDisplacementTimeseriesByYear @include(if: $combineCountries) {
                totalRounded
                year
            }
            newDisplacementTimeseriesByYear @include(if: $combineCountries) {
                totalRounded
                year
            }
            totalDisplacementTimeseriesByCountry @skip(if: $combineCountries) {
                country {
                    countryName
                    id
                    iso3
                }
                totalRounded
                year
            }
            newDisplacementTimeseriesByCountry @skip(if: $combineCountries) {
                country {
                    countryName
                    id
                    iso3
                }
                totalRounded
                year
            }
        }
        giddDisasterTimeseries: giddPublicDisasterStatistics(
            hazardTypes: $hazardTypes,
            countriesIso3: $countriesIso3,
            endYear: $endYearForTimeseries,
            startYear: $startYearForTimeseries,
            releaseEnvironment: $releaseEnvironment,
            clientId: $clientId,
        ) {
            totalDisplacementTimeseriesByYear @include(if: $combineCountries) {
                totalRounded
                year
            }
            newDisplacementTimeseriesByYear @include(if: $combineCountries) {
                totalRounded
                year
            }
            totalDisplacementTimeseriesByCountry @skip(if: $combineCountries) {
                country {
                    countryName
                    id
                    iso3
                }
                totalRounded
                year
            }
            newDisplacementTimeseriesByCountry @skip(if: $combineCountries) {
                country {
                    countryName
                    id
                    iso3
                }
                totalRounded
                year
            }
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

function triggerTypeLabelSelector(d: { id: string, name: string }) {
    return getHazardTypeLabel({ id: d.id, label: d.name });
}

function yearKeySelector(d: { key: number }) {
    return d.key;
}

function yearLabelSelector(d: { label: string }) {
    return d.label;
}

type Cause = 'conflict' | 'disaster';
type CauseSegmentKey = Cause | 'all';
type CauseSegmentOption = {
    key: CauseSegmentKey;
    label: string;
};
const causeSegmentKeySelector = (option: CauseSegmentOption) => option.key;
const causeSegmentLabelSelector = (option: CauseSegmentOption) => option.label;

const causeSegmentOptions: CauseSegmentOption[] = [
    {
        key: 'all',
        label: 'All',
    },
    {
        key: 'conflict',
        label: 'Conflict',
    },
    {
        key: 'disaster',
        label: 'Disasters',
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
        label: 'Internally displaced people (IDPs)',
    },
];

type Precision = 'rounded' | 'exact';
type PrecisionOption = {
    key: Precision;
    label: string;
};
const precisionKeySelector = (option: PrecisionOption) => option.key;
const precisionLabelSelector = (option: PrecisionOption) => option.label;
const precisionOptions: PrecisionOption[] = [
    {
        key: 'rounded',
        label: 'Rounded',
    },
    {
        key: 'exact',
        label: 'Exact',
    },
];

type View = 'map' | 'table' | 'charts' | 'events';
type ViewOption = {
    key: View;
    label: string;
};
const viewKeySelector = (option: ViewOption) => option.key;
const viewLabelSelector = (option: ViewOption) => option.label;
const allViewOptions: ViewOption[] = [
    { key: 'map', label: 'Map' },
    { key: 'table', label: 'Table' },
    { key: 'charts', label: 'Charts' },
    { key: 'events', label: 'Events' },
];

// matches IduMap's mobile breakpoint — the map is hidden on mobile there too
const MOBILE_BREAKPOINT = 720;

type RegionOption = {
    key: string;
    label: string;
};
const regionKeySelector = (option: RegionOption) => option.key;
const regionLabelSelector = (option: RegionOption) => option.label;

export interface Props {
    endYear: number;
    clientCode: string;
}

function Gidd(props: Props) {
    const {
        endYear,
        clientCode,
    } = props;

    const [timeRange, setTimeRange] = useState([endYear, endYear]);
    const [displacementCause, setDisplacementCause] = useState<Cause | undefined>();
    const [combineCauseCharts, setCombineCauseCharts] = useState(false);
    const [displacementCategory, setDisplacementCategory] = useState<Category | undefined>();
    const [activeView, setActiveView] = useState<View>('map');
    const [combineCountriesChart, setCombineCountriesChart] = useState(false);
    const [dataActivePage, setDataActivePage] = useState<number>(1);
    const [eventsActivePage, setEventsActivePage] = useState<number>(1);
    const [eventSearchText, setEventSearchText] = useState<string | undefined>();
    const [precision, setPrecision] = useState<Precision>('rounded');
    const [
        countries,
        setCountries,
    ] = useState<string[]>([]);
    const [
        triggerTypes,
        setTriggerTypes,
    ] = useState<string[]>([]);
    const [regions, setRegions] = useState<string[]>([]);
    const [filtersExpanded, setFiltersExpanded] = useState(false);

    const { width: viewportWidth } = useDocumentSize();
    const isMobile = viewportWidth <= MOBILE_BREAKPOINT;

    const viewOptions = useMemo(() => (
        isMobile ? allViewOptions.filter((option) => option.key !== 'map') : allViewOptions
    ), [isMobile]);

    useEffect(() => {
        if (isMobile) {
            setActiveView((prevView) => (prevView === 'map' ? 'table' : prevView));
        }
    }, [isMobile]);

    const handleFiltersToggle = useCallback(() => {
        setFiltersExpanded((prev) => !prev);
    }, []);

    const handleCauseChange = useCallback((newVal: Cause | undefined) => {
        setDisplacementCause(newVal);

        if (newVal === 'conflict' || newVal === undefined) {
            setTriggerTypes([]);
        }
        if (newVal) {
            setCombineCauseCharts(false);
        }
        setDataActivePage(1);
        setEventsActivePage(1);
    }, [
        setTriggerTypes,
    ]);

    const handleCauseSegmentChange = useCallback((newVal: CauseSegmentKey) => {
        handleCauseChange(newVal === 'all' ? undefined : newVal);
    }, [handleCauseChange]);

    const handleCountriesChange = useCallback((newVal: string[]) => {
        setCountries(newVal);

        if (newVal.length === 0 || newVal.length > 3) {
            setCombineCountriesChart(false);
        }
        setDataActivePage(1);
        setEventsActivePage(1);
    }, [setCountries]);

    const handleCountryFocus = useCallback((iso3: string) => {
        handleCountriesChange([iso3]);
    }, [handleCountriesChange]);

    const handleTimeRangeChange = useCallback((newVal: number[]) => {
        setTimeRange(newVal);

        setDataActivePage(1);
        setEventsActivePage(1);
    }, []);

    const handleStartYearChange = useCallback((newVal: number | undefined) => {
        if (isNotDefined(newVal)) {
            return;
        }
        handleTimeRangeChange([newVal, Math.max(newVal, timeRange[1])]);
    }, [timeRange, handleTimeRangeChange]);

    const handleEndYearChange = useCallback((newVal: number | undefined) => {
        if (isNotDefined(newVal)) {
            return;
        }
        handleTimeRangeChange([Math.min(timeRange[0], newVal), newVal]);
    }, [timeRange, handleTimeRangeChange]);

    const handleReset = useCallback(() => {
        handleCountriesChange([]);
        setTriggerTypes([]);
        setRegions([]);
        handleCauseChange(undefined);
        setTimeRange([endYear, endYear]);
        setDisplacementCategory(undefined);
        setActiveView(isMobile ? 'table' : 'map');
        setDataActivePage(1);
        setEventsActivePage(1);
    }, [
        handleCauseChange,
        handleCountriesChange,
        setTriggerTypes,
        isMobile,
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

    const yearFilterOptions = useMemo(() => (
        Array.from(
            { length: (endYear - START_YEAR) + 1 },
            (_, index) => {
                const year = START_YEAR + index;
                return { key: year, label: String(year) };
            },
        )
    ), [endYear]);

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
            variables: {
                clientId: clientCode,
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    const { regionToIso3, regionOptions } = useMemo(() => {
        const regionNames = new Map<string, string>();
        const regionIso3Map = new Map<string, string[]>();
        (countryFilterResponse?.giddPublicCountries ?? []).forEach((country) => {
            if (country?.region && isDefined(country.iso3)) {
                regionNames.set(country.region.id, country.region.name ?? country.region.id);
                const existing = regionIso3Map.get(country.region.id) ?? [];
                existing.push(country.iso3);
                regionIso3Map.set(country.region.id, existing);
            }
        });
        const options: RegionOption[] = [...regionNames.entries()]
            .map(([id, name]) => ({ key: id, label: name }))
            .sort((a, b) => compareString(a.label, b.label));
        return { regionToIso3: regionIso3Map, regionOptions: options };
    }, [countryFilterResponse]);

    const applyRegions = useCallback((nextRegions: string[]) => {
        setRegions(nextRegions);
        if (nextRegions.length > 0) {
            const allowed = new Set(nextRegions.flatMap((id) => regionToIso3.get(id) ?? []));
            setCountries((prev) => prev.filter((iso3) => allowed.has(iso3)));
        }
        setDataActivePage(1);
        setEventsActivePage(1);
    }, [regionToIso3]);

    const countriesOptions = useMemo(() => {
        const allowedIso3 = regions.length > 0
            ? new Set(regions.flatMap((id) => regionToIso3.get(id) ?? []))
            : undefined;
        return removeNull(
            [...(countryFilterResponse?.giddPublicCountries ?? [])],
        )?.filter(isDefined)
            .filter((country) => (
                !allowedIso3 || (isDefined(country.iso3) && allowedIso3.has(country.iso3))
            ))
            .sort((a, b) => compareString(a.idmcShortName, b.idmcShortName));
    }, [countryFilterResponse, regions, regionToIso3]);

    const effectiveCountries = useMemo(() => {
        if (countries.length > 0) {
            return countries;
        }
        if (regions.length > 0) {
            return Array.from(new Set(regions.flatMap((id) => regionToIso3.get(id) ?? [])));
        }
        return countries;
    }, [countries, regions, regionToIso3]);

    const figureAnalysisCountries = useMemo(() => (
        countries.map((iso3) => {
            const option = countriesOptions?.find((item) => item.iso3 === iso3);
            return { iso3, name: option?.idmcShortName ?? iso3 };
        })
    ), [countries, countriesOptions]);

    const showCombinedCountries = combineCountriesChart
        || countries.length > 3 || countries.length === 0;

    const statisticsVariables = useMemo(() => ({
        countriesIso3: effectiveCountries,
        combineCountries: showCombinedCountries,
        hazardTypes: isDisasterDataShown ? triggerTypes : undefined,
        startYear: timeRange[0],
        endYear: timeRange[1],
        startYearForTimeseries: timeRange[0] === timeRange[1] ? START_YEAR : timeRange[0],
        endYearForTimeseries: timeRange[1],
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        isDisasterDataShown,
        triggerTypes,
        showCombinedCountries,
        timeRange,
        effectiveCountries,
        clientCode,
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

    const conflictStats = removeNull(statisticsResponse?.giddPublicConflictStatistics);
    const disasterStats = removeNull(statisticsResponse?.giddPublicDisasterStatistics);
    const combinedStats = removeNull(statisticsResponse?.giddPublicCombinedStatistics);

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
                (item) => item.totalRounded,
            );
            const conflictDataByYear = listToMap(
                conflictChartData?.totalDisplacementTimeseriesByYear,
                (item) => item.year,
                (item) => item.totalRounded,
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
                    conflict: item.totalRounded,
                })) ?? []),
                ...(disasterChartData?.totalDisplacementTimeseriesByYear?.map((item) => ({
                    year: item.year,
                    disaster: item.totalRounded,
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
                    [`disaster-${item.country.iso3}`]: item.totalRounded,
                }),
            )).flat();
            const conflictDataByCountries = Object.values(listToGroupList(
                conflictChartData?.totalDisplacementTimeseriesByCountry ?? [],
                (item) => item.country.id,
                (item) => ({
                    iso3: item.country.iso3,
                    countryName: item.country.countryName,
                    year: Number(item.year),
                    [`conflict-${item.country.iso3}`]: item.totalRounded,
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
                    total: item.totalRounded,
                }),
            );
            const conflictDataByCountries = listToMap(
                conflictChartData?.totalDisplacementTimeseriesByCountry ?? [],
                (item) => `${item.year}-${item.country.iso3}` as string,
                (item) => ({
                    year: Number(item.year),
                    countryName: item.country.countryName,
                    iso3: item.country.iso3,
                    total: item.totalRounded,
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
                (item) => item.totalRounded,
            );
            const conflictDataByYear = listToMap(
                conflictChartData?.newDisplacementTimeseriesByYear,
                (item) => item.year,
                (item) => item.totalRounded,
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
                (item) => item.totalRounded,
            );
            const conflictDataByYear = listToMap(
                conflictChartData?.newDisplacementTimeseriesByYear,
                (item) => item.year,
                (item) => item.totalRounded,
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
                    [`disaster-${item.country.iso3}`]: item.totalRounded,
                }),
            )).flat();
            const conflictDataByCountries = Object.values(listToGroupList(
                conflictChartData?.newDisplacementTimeseriesByCountry ?? [],
                (item) => item.country.id,
                (item) => ({
                    year: Number(item.year),
                    [`conflict-${item.country.iso3}`]: item.totalRounded,
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
                    total: item.totalRounded,
                }),
            );
            const conflictDataByCountries = listToMap(
                conflictChartData?.newDisplacementTimeseriesByCountry ?? [],
                (item) => `${item.year}-${item.country.iso3}` as string,
                (item) => ({
                    year: Number(item.year),
                    countryName: item.country.countryName,
                    iso3: item.country.iso3,
                    total: item.totalRounded,
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

    const triggerTypeOptions = useMemo(
        () => {
            const options = removeNull(
                countryFilterResponse?.giddPublicHazardTypes,
            )?.filter(isDefined) ?? [];

            return [...options].sort((a, b) => compareString(a?.name, b?.name));
        },
        [countryFilterResponse],
    );

    const sortedHazards = useMemo(
        () => ([...(disasterStats?.displacementsByHazardType ?? [])].sort(
            (foo, bar) => compareNumber(
                foo.newDisplacementsRounded,
                bar.newDisplacementsRounded,
                -1,
            ),
        )),
        [disasterStats?.displacementsByHazardType],
    );

    const disaggregationAvailable = isDisaggregationAvailable({
        filterStartYear: timeRange[0],
        filterEndYear: timeRange[1],
    });

    const maxDisplacementValue = sortedHazards[0]?.newDisplacementsRounded ?? undefined;

    const hazardGrandTotal = useMemo(
        () => sum(sortedHazards.map((hazard) => hazard.newDisplacementsRounded ?? 0)),
        [sortedHazards],
    );

    const selectedTriggerType = triggerTypes.length === 1 ? triggerTypes[0] : undefined;

    const handleHazardSelect = useCallback((triggerType: string) => {
        setTriggerTypes((prev) => (
            prev.length === 1 && prev[0] === triggerType ? [] : [triggerType]
        ));
        setDataActivePage(1);
        setEventsActivePage(1);
    }, []);

    const handleViewEvents = useCallback(() => {
        setActiveView('events');
    }, []);

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

    const flowChartBlock = displacementCategory !== 'stock' && (
        <div className={styles.chartBlock}>
            <Header
                heading="Internal Displacements"
                headingSize="medium"
                headingTooltip={flowDetails}
                headingDescription={`New displacements per year globally, ${domainForCharts[0]}–${domainForCharts[1]}`}
            />
            <div className={styles.chartPanel}>
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
        </div>
    );

    const stockChartBlock = displacementCategory !== 'flow' && (
        <div className={styles.chartBlock}>
            <Header
                heading="Internally displaced people (IDPs)"
                headingTooltip={stockDetails}
                headingSize="medium"
                headingDescription={`People living in displacement at year end globally, as of ${domainForCharts[1]}`}
            />
            <div className={styles.chartPanel}>
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
        </div>
    );

    const isFlowSelected = displacementCategory === 'flow';
    const isStockSelected = displacementCategory === 'stock';

    const shownOnMap = (
        <span className={styles.shownOnMap}>
            <span className={styles.shownOnMapDot} />
            shown on map
        </span>
    );
    const showOnMapFlow = (
        <RawButton
            name={undefined}
            className={styles.showOnMapButton}
            onClick={() => setDisplacementCategory('flow')}
        >
            show on map →
        </RawButton>
    );
    const showOnMapStock = (
        <RawButton
            name={undefined}
            className={styles.showOnMapButton}
            onClick={() => setDisplacementCategory('stock')}
        >
            show on map →
        </RawButton>
    );

    const glanceCard = (
        <div className={styles.glanceCard}>
            <div className={_cs(styles.glanceSection, isFlowSelected && styles.selected)}>
                <Header
                    heading="Internal Displacements"
                    headingSize="medium"
                    headingTooltip={flowDetails}
                    actions={isFlowSelected ? shownOnMap : showOnMapFlow}
                />
                {!displacementCause && (
                    <NumberBlock
                        label="Total"
                        size="large"
                        subLabel={getCountryCountSubLabel(
                            combinedStats?.internalDisplacementCountries,
                        )}
                        value={combinedStats?.internalDisplacementsRounded}
                        abbreviated={precision === 'rounded'}
                    />
                )}
                <div className={styles.numberRow}>
                    {isConflictDataShown && (
                        <NumberBlock
                            label="Total by conflict and violence"
                            size={displacementCause ? 'large' : 'medium'}
                            variant="conflict"
                            subLabel={getCountryCountSubLabel(
                                conflictStats?.internalDisplacementCountries,
                            )}
                            value={conflictStats?.newDisplacementsRounded}
                            abbreviated={precision === 'rounded'}
                        />
                    )}
                    {isDisasterDataShown && (
                        <NumberBlock
                            label="Total by disasters"
                            size={displacementCause ? 'large' : 'medium'}
                            variant="disaster"
                            subLabel={getCountryCountSubLabel(
                                disasterStats?.internalDisplacementCountries,
                            )}
                            value={disasterStats?.newDisplacementsRounded}
                            abbreviated={precision === 'rounded'}
                        />
                    )}
                </div>
            </div>
            <div className={_cs(styles.glanceSection, isStockSelected && styles.selected)}>
                <Header
                    heading="Internally displaced people (IDPs)"
                    headingTooltip={stockDetails}
                    headingSize="medium"
                    actions={isStockSelected ? shownOnMap : showOnMapStock}
                />
                {!displacementCause && (
                    <NumberBlock
                        label="Total"
                        size="large"
                        subLabel={getCountryStockCountSubLabel(
                            combinedStats?.totalDisplacementCountries,
                            timeRange[1],
                        )}
                        value={combinedStats?.totalDisplacementsRounded}
                        abbreviated={precision === 'rounded'}
                    />
                )}
                <div className={styles.numberRow}>
                    {isConflictDataShown && (
                        <NumberBlock
                            label="Total by conflict and violence"
                            variant="conflict"
                            size={displacementCause ? 'large' : 'medium'}
                            subLabel={getCountryStockCountSubLabel(
                                conflictStats?.totalDisplacementCountries,
                                timeRange[1],
                            )}
                            value={conflictStats?.totalDisplacementsRounded}
                            abbreviated={precision === 'rounded'}
                        />
                    )}
                    {isDisasterDataShown && (
                        <NumberBlock
                            label="Total by disasters"
                            size={displacementCause ? 'large' : 'medium'}
                            variant="disaster"
                            subLabel={getCountryStockCountSubLabel(
                                disasterStats?.totalDisplacementCountries,
                                timeRange[1],
                            )}
                            value={disasterStats?.totalDisplacementsRounded}
                            abbreviated={precision === 'rounded'}
                        />
                    )}
                </div>
            </div>
        </div>
    );

    const glanceSlides: { key: string; content: React.ReactNode }[] = [
        { key: 'glance', content: glanceCard },
    ];
    if (displacementCause === 'disaster') {
        glanceSlides.push({
            key: 'hazard',
            content: (
                <HazardBreakdownCard
                    className={styles.glanceCard}
                    sortedHazards={sortedHazards}
                    maxDisplacementValue={maxDisplacementValue}
                    grandTotal={hazardGrandTotal}
                    totalEvents={disasterStats?.totalEvents}
                    selectedTriggerType={selectedTriggerType}
                    onHazardSelect={handleHazardSelect}
                    abbreviate={precision === 'rounded'}
                />
            ),
        });
        glanceSlides.push({
            key: 'events',
            content: (
                <LargestEventsCard
                    className={styles.glanceCard}
                    countriesIso3={effectiveCountries}
                    hazardTypes={triggerTypes}
                    startYear={timeRange[0]}
                    endYear={timeRange[1]}
                    clientCode={clientCode}
                    onViewEvents={handleViewEvents}
                    abbreviate={precision === 'rounded'}
                />
            ),
        });
    }
    glanceSlides.push({
        key: 'figure-analysis',
        content: (
            <FigureAnalysisCard
                className={styles.glanceCard}
                countries={figureAnalysisCountries}
                year={timeRange[1]}
                clientCode={clientCode}
            />
        ),
    });

    const appliedFilterCount = (
        (isDefined(displacementCategory) ? 1 : 0)
        + (isDefined(displacementCause) ? 1 : 0)
        + (triggerTypes.length > 0 ? 1 : 0)
        + (regions.length > 0 ? 1 : 0)
        + (countries.length > 0 ? 1 : 0)
        + (timeRange[0] !== endYear || timeRange[1] !== endYear ? 1 : 0)
    );

    const activeFilters = useMemo(() => {
        const filters: { key: string; label: string; onRemove: () => void }[] = [];
        if (displacementCategory) {
            const option = displacementCategoryOptions.find(
                (item) => item.key === displacementCategory,
            );
            filters.push({
                key: 'category',
                label: option?.label ?? displacementCategory,
                onRemove: () => setDisplacementCategory(undefined),
            });
        }
        if (displacementCause) {
            const option = causeSegmentOptions.find((item) => item.key === displacementCause);
            filters.push({
                key: 'cause',
                label: option?.label ?? displacementCause,
                onRemove: () => handleCauseSegmentChange('all'),
            });
        }
        triggerTypes.forEach((triggerType) => {
            const option = triggerTypeOptions.find((item) => item.id === triggerType);
            filters.push({
                key: `trigger:${triggerType}`,
                label: option ? triggerTypeLabelSelector(option) : triggerType,
                onRemove: () => setTriggerTypes(
                    (prev) => prev.filter((item) => item !== triggerType),
                ),
            });
        });
        regions.forEach((regionId) => {
            const option = regionOptions.find((item) => item.key === regionId);
            filters.push({
                key: `region:${regionId}`,
                label: option?.label ?? regionId,
                onRemove: () => applyRegions(regions.filter((item) => item !== regionId)),
            });
        });
        countries.forEach((iso3) => {
            const option = countriesOptions?.find((item) => item.iso3 === iso3);
            filters.push({
                key: `country:${iso3}`,
                label: option?.idmcShortName ?? iso3,
                onRemove: () => handleCountriesChange(countries.filter((item) => item !== iso3)),
            });
        });
        if (timeRange[0] !== endYear || timeRange[1] !== endYear) {
            filters.push({
                key: 'timescale',
                label: `${timeRange[0]} - ${timeRange[1]}`,
                onRemove: () => setTimeRange([endYear, endYear]),
            });
        }
        return filters;
    }, [
        displacementCategory,
        displacementCause,
        triggerTypes,
        triggerTypeOptions,
        regions,
        regionOptions,
        applyRegions,
        countries,
        countriesOptions,
        handleCountriesChange,
        handleCauseSegmentChange,
        timeRange,
        endYear,
    ]);

    return (
        <div className={styles.bodyContainer}>
            <div className={styles.gidd}>
                <div className={styles.headerRow}>
                    <div className={styles.headerText}>
                        <h1 className={styles.heading}>{headingText}</h1>
                        <p className={styles.headingDescription}>{mainText}</p>
                    </div>
                    <div className={styles.headerActions}>
                        <Button
                            name="resetQuery"
                            onClick={handleReset}
                            icons={<IoRefreshOutline />}
                            transparent
                        >
                            Reset filters
                        </Button>
                    </div>
                </div>

                <div className={_cs(styles.filters, filtersExpanded && styles.filtersExpanded)}>
                    <RawButton
                        name={undefined}
                        className={styles.filtersToggle}
                        onClick={handleFiltersToggle}
                    >
                        <IoFilterOutline />
                        Filters
                        {appliedFilterCount > 0 && (
                            <span className={styles.countPill}>
                                {appliedFilterCount}
                            </span>
                        )}
                        {filtersExpanded ? (
                            <IoChevronUpOutline className={styles.chevron} />
                        ) : (
                            <IoChevronDownOutline className={styles.chevron} />
                        )}
                    </RawButton>
                    <div className={_cs(
                        styles.filterBar,
                        filtersExpanded && styles.filterBarExpanded,
                    )}
                    >
                        <div className={styles.filterBarLeft}>
                            <SelectInput
                                name="category"
                                className={_cs(styles.filterItem, styles.filterInput)}
                                placeholder="Internal Displacements or IDPs"
                                keySelector={categoryKeySelector}
                                labelSelector={categoryLabelSelector}
                                value={displacementCategory}
                                onChange={setDisplacementCategory}
                                options={displacementCategoryOptions}
                            />
                            <SegmentInput
                                name="cause"
                                className={_cs(
                                    styles.filterCause,
                                    styles.filterInput,
                                    styles.filterSegment,
                                )}
                                keySelector={causeSegmentKeySelector}
                                labelSelector={causeSegmentLabelSelector}
                                value={displacementCause ?? 'all'}
                                onChange={handleCauseSegmentChange}
                                options={causeSegmentOptions}
                            />
                            <MultiSelectInput
                                name="triggerType"
                                className={_cs(styles.filterItem, styles.filterInput)}
                                placeholder="All trigger types"
                                hint={displacementCause === 'conflict'
                                    ? 'Not available for conflict and violence yet'
                                    : undefined}
                                value={triggerTypes}
                                options={triggerTypeOptions}
                                keySelector={idSelector}
                                labelSelector={triggerTypeLabelSelector}
                                onChange={setTriggerTypes}
                                disabled={displacementCause === 'conflict'}
                            />
                            <MultiSelectInput
                                name="regions"
                                className={_cs(styles.filterItem, styles.filterInput)}
                                placeholder="All regions"
                                value={regions}
                                options={regionOptions}
                                keySelector={regionKeySelector}
                                labelSelector={regionLabelSelector}
                                onChange={applyRegions}
                            />
                            <MultiSelectInput
                                name="country"
                                className={_cs(styles.filterItem, styles.filterInput)}
                                placeholder="All countries and territories"
                                value={countries}
                                options={countriesOptions}
                                keySelector={countryKeySelector}
                                labelSelector={nameSelector}
                                onChange={handleCountriesChange}
                            />
                        </div>
                        <div className={styles.filterBarRight}>
                            <div className={styles.filterYear}>
                                <div className={styles.yearField}>
                                    <span className={styles.yearLabel}>From</span>
                                    <SelectInput
                                        name="startYear"
                                        className={_cs(styles.yearSelect, styles.filterInput)}
                                        keySelector={yearKeySelector}
                                        labelSelector={yearLabelSelector}
                                        value={timeRange[0]}
                                        onChange={handleStartYearChange}
                                        options={yearFilterOptions}
                                        nonClearable
                                    />
                                </div>
                                <div className={styles.yearField}>
                                    <span className={styles.yearLabel}>To</span>
                                    <SelectInput
                                        name="endYear"
                                        className={_cs(styles.yearSelect, styles.filterInput)}
                                        keySelector={yearKeySelector}
                                        labelSelector={yearLabelSelector}
                                        value={timeRange[1]}
                                        onChange={handleEndYearChange}
                                        options={yearFilterOptions}
                                        nonClearable
                                    />
                                </div>
                            </div>
                            <SegmentInput
                                name="precision"
                                className={_cs(
                                    styles.filterCause,
                                    styles.filterInput,
                                    styles.filterSegment,
                                )}
                                keySelector={precisionKeySelector}
                                labelSelector={precisionLabelSelector}
                                options={precisionOptions}
                                value={precision}
                                onChange={setPrecision}
                            />
                        </div>
                    </div>
                </div>
                {!filtersExpanded && activeFilters.length > 0 && (
                    <div className={styles.activeFilters}>
                        {activeFilters.map((filter) => (
                            <FilterPill
                                key={filter.key}
                                label={filter.label}
                                onRemove={filter.onRemove}
                            />
                        ))}
                    </div>
                )}

                <div className={styles.mainRow}>
                    <div className={styles.mainPanel}>
                        <div className={styles.viewSelector}>
                            <SegmentInput
                                name="activeView"
                                className={_cs(styles.filterInput, styles.filterSegment)}
                                keySelector={viewKeySelector}
                                labelSelector={viewLabelSelector}
                                options={viewOptions}
                                value={activeView}
                                onChange={setActiveView}
                            />
                            {activeView === 'events' && (
                                <TextInput
                                    className={_cs(styles.eventSearch, styles.filterInput)}
                                    name="eventSearch"
                                    placeholder="Search events..."
                                    value={eventSearchText}
                                    onChange={setEventSearchText}
                                    icons={<IoSearchOutline />}
                                />
                            )}
                        </div>
                        <div className={styles.viewPanels}>
                            {activeView === 'map' && (
                                <GiddMap
                                    cause={displacementCause}
                                    category={displacementCategory}
                                    countriesIso3={effectiveCountries}
                                    startYear={timeRange[0]}
                                    endYear={timeRange[1]}
                                    clientCode={clientCode}
                                    onCountryFocus={handleCountryFocus}
                                />
                            )}
                            {activeView === 'table' && (
                                <DataTable
                                    isConflictDataShown={isConflictDataShown}
                                    isDisasterDataShown={isDisasterDataShown}
                                    countriesIso3={effectiveCountries}
                                    cause={displacementCause}
                                    startYear={timeRange[0]}
                                    endYear={timeRange[1]}
                                    activePage={dataActivePage}
                                    onActivePageChange={setDataActivePage}
                                    clientCode={clientCode}
                                    abbreviate={precision === 'rounded'}
                                />
                            )}
                            {activeView === 'charts' && (
                                <>
                                    {chartTypeSelection}
                                    <div className={styles.chartsStack}>
                                        {flowChartBlock}
                                        {stockChartBlock}
                                    </div>
                                </>
                            )}
                            {activeView === 'events' && (
                                <EventsTable
                                    activePage={eventsActivePage}
                                    onActivePageChange={setEventsActivePage}
                                    countriesIso3={effectiveCountries}
                                    hazardTypes={triggerTypes}
                                    startYear={timeRange[0]}
                                    endYear={timeRange[1]}
                                    clientCode={clientCode}
                                    searchText={eventSearchText}
                                />
                            )}
                        </div>
                    </div>

                    <div className={styles.sidebar}>
                        <div className={styles.sidebarHeading}>
                            At a glance
                        </div>
                        <SlideCarousel slides={glanceSlides} />

                        <div className={styles.todoPlaceholder}>
                            TODO — remaining insight pages (Most internal
                            displacements / Largest displaced populations,
                            Emerging increases, Figure analysis) and their
                            pagination
                        </div>

                        <div className={styles.downloadFooter}>
                            <p className={styles.downloadDescription}>
                                {downloadText}
                            </p>
                            <DownloadMenu
                                cause={displacementCause}
                                countriesIso3={effectiveCountries}
                                hazardTypes={triggerTypes}
                                startYear={timeRange[0]}
                                endYear={timeRange[1]}
                                clientCode={clientCode}
                                disaggregationAvailable={disaggregationAvailable}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export function GiddWithYear(props: Omit<Props, 'endYear'>) {
    // eslint-disable-next-line react/destructuring-assignment
    const { loading, year, error } = useYear(props.clientCode);
    if (loading) {
        return null;
    }
    if (error || !year) {
        return (
            <Message message="Some error occurred!" />
        );
    }
    return (
        <Gidd
            {...props}
            endYear={year}
        />
    );
}

export default Gidd;
