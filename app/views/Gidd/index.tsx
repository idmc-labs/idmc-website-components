import React, {
    useMemo,
    useCallback,
    useState,
    useEffect,
    useRef,
} from 'react';
import {
    _cs,
    compareString,
    isNotDefined,
    listToMap,
    listToGroupList,
    isDefined,
} from '@togglecorp/fujs';
import {
    Switch,
    SelectInput,
    MultiSelectInput,
    SegmentInput,
    TextInput,
    Button,
    useSortState,
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
    formatFullNumber,
    START_YEAR,
    sumAndRemoveZero,
    DATA_RELEASE,
    getHazardTypeLabel,
    isDisaggregationAvailable,
    suffixDrupalEndpoint,
    HELIX_REST_ENDPOINT,
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
import Numeral from '#components/Numeral';
import RawButton from '#components/RawButton';
import SlideCarousel from '#components/SlideCarousel';
import FilterPill from '#components/IduMap/FilterPill';
import { toSentenceCase } from '#components/IduMap/EventListItem';
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
import { buildCausePhrase, buildScopeLabel, buildTriggerFilterSuffix } from '#utils/strings';

import EventsTable from './EventsTable';
import DataTable from './DataTable';
import DownloadMenu from './DownloadMenu';
import GiddMap from './GiddMap';
import FigureAnalysisCard from './FigureAnalysisCard';
import TopCountriesCard from './TopCountriesCard';
import TypeBreakdownCard from './TypeBreakdownCard';

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
const mainText = 'Explore the GIDD, IDMC’s global repository of internal displacement data, covering since 2008';
const flowDetails = 'The number of times people are forced to move inside their country during a specific time period.';
const stockDetails = 'The number of people living in internal displacement at a specific point in time.';

const iduDashboardLink = suffixDrupalEndpoint('/internal-displacement-updates/');
const documentationLink = `${HELIX_REST_ENDPOINT.replace(/\/+$/, '')}/#/`;

const DEFAULT_DATA_SORTING = { name: 'year', direction: 'dsc' } as const;
const DEFAULT_EVENTS_SORTING = { name: 'startDate', direction: 'dsc' } as const;

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
            geographicalGroup {
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
        giddPublicViolenceSubTypes(
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
        $violenceSubTypes: [ID!],
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
            violenceSubTypes: $violenceSubTypes,
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
            violenceSubTypes: $violenceSubTypes,
            clientId: $clientId,
        ) {
            totalDisplacementTimeseriesByYear @include(if: $combineCountries) {
                totalRounded
                total
                year
            }
            newDisplacementTimeseriesByYear @include(if: $combineCountries) {
                totalRounded
                total
                year
            }
            totalDisplacementTimeseriesByCountry @skip(if: $combineCountries) {
                country {
                    countryName
                    id
                    iso3
                }
                totalRounded
                total
                year
            }
            newDisplacementTimeseriesByCountry @skip(if: $combineCountries) {
                country {
                    countryName
                    id
                    iso3
                }
                totalRounded
                total
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
                total
                year
            }
            newDisplacementTimeseriesByYear @include(if: $combineCountries) {
                totalRounded
                total
                year
            }
            totalDisplacementTimeseriesByCountry @skip(if: $combineCountries) {
                country {
                    countryName
                    id
                    iso3
                }
                totalRounded
                total
                year
            }
            newDisplacementTimeseriesByCountry @skip(if: $combineCountries) {
                country {
                    countryName
                    id
                    iso3
                }
                totalRounded
                total
                year
            }
        }
    }
`;

function countryKeySelector(d: { iso3: string }) {
    return d.iso3;
}

function nameSelector(d: { idmcShortName: string }) {
    return d.idmcShortName;
}

function triggerTypeLabelSelector(d: { id: string, name: string }) {
    return toSentenceCase(getHazardTypeLabel({ id: d.id, label: d.name })) ?? d.name;
}

function violenceSubTypeLabelSelector(d: { name: string }) {
    return toSentenceCase(d.name) ?? d.name;
}

function yearKeySelector(d: { key: number }) {
    return d.key;
}

function yearLabelSelector(d: { label: string }) {
    return d.label;
}

type Cause = 'conflict' | 'disaster';
type CauseOption = {
    key: Cause;
    label: string;
};
const causeKeySelector = (option: CauseOption) => option.key;
const causeLabelSelector = (option: CauseOption) => option.label;

const causeOptions: CauseOption[] = [
    {
        key: 'conflict',
        label: 'Conflict and violence',
    },
    {
        key: 'disaster',
        label: 'Disasters',
    },
];

function makeTriggerKey(group: Cause, id: string): string {
    return `${group}:${id}`;
}

function parseTriggerKey(key: string): { group: Cause; id: string } | undefined {
    const sepIndex = key.indexOf(':');
    if (sepIndex === -1) {
        return undefined;
    }
    const group = key.slice(0, sepIndex);
    const id = key.slice(sepIndex + 1);
    if (group !== 'disaster' && group !== 'conflict') {
        return undefined;
    }
    return { group, id };
}

const TRIGGER_GROUP_LABELS: Record<Cause, string> = {
    disaster: 'Disasters',
    conflict: 'Conflict and violence',
};

interface TriggerTypeOption {
    key: string;
    id: string;
    label: string;
    group: Cause;
    groupLabel: string;
}

function triggerTypeOptionKeySelector(option: TriggerTypeOption) {
    return option.key;
}
function triggerTypeOptionLabelSelector(option: TriggerTypeOption) {
    return option.label;
}
function triggerTypeOptionGroupKeySelector(option: TriggerTypeOption) {
    return option.group;
}
function triggerTypeOptionGroupLabelSelector(option: TriggerTypeOption) {
    return option.groupLabel;
}

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
        label: 'Internal displacements',
    },
    {
        key: 'stock',
        label: 'Internally displaced people (IDPs)',
    },
];

// NOTE: this picks how a figure is written out, not which figure is shown. A published
// figure is the API's own rounded one; a figure this view sums itself -- a combined series,
// a country total -- is summed from the raw fields, because rounding the parts first
// compounds their errors. "Exact" therefore means the full digits of whichever of the two
// applies, not the unrounded source value.
type NumberFormat = 'abbreviated' | 'full';
type NumberFormatOption = {
    key: NumberFormat;
    label: string;
};
const numberFormatKeySelector = (option: NumberFormatOption) => option.key;
const numberFormatLabelSelector = (option: NumberFormatOption) => option.label;
const numberFormatOptions: NumberFormatOption[] = [
    {
        key: 'abbreviated',
        label: 'Rounded',
    },
    {
        key: 'full',
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
    { key: 'charts', label: 'Charts' },
    { key: 'table', label: 'Table' },
    { key: 'events', label: 'Events' },
    { key: 'map', label: 'Map' },
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
    const [activeView, setActiveView] = useState<View>('charts');
    const [combineCountriesChart, setCombineCountriesChart] = useState(false);
    const [dataActivePage, setDataActivePage] = useState<number>(1);
    const [eventsActivePage, setEventsActivePage] = useState<number>(1);

    // Sorting sits here rather than in the tables because it has to clear with the filters,
    // and because the tables unmount when the view switches -- state they owned would reset
    // on every tab change instead of on the change that actually invalidates it.
    const overallDataSortState = useSortState(DEFAULT_DATA_SORTING);
    const eventDataSortState = useSortState(DEFAULT_EVENTS_SORTING);
    const { setSorting: setDataSorting } = overallDataSortState;
    const { setSorting: setEventsSorting } = eventDataSortState;

    // Every filter change invalidates the page the reader is on and the order they chose.
    const resetTableState = useCallback(() => {
        setDataActivePage(1);
        setEventsActivePage(1);
        setDataSorting(DEFAULT_DATA_SORTING);
        setEventsSorting(DEFAULT_EVENTS_SORTING);
    }, [setDataSorting, setEventsSorting]);

    // A re-sort reorders the whole result set, so the page number no longer means anything.
    // Guarded against the first run, which would otherwise discard the page on mount.
    const lastDataSorting = useRef(overallDataSortState.sorting);
    useEffect(() => {
        if (lastDataSorting.current === overallDataSortState.sorting) {
            return;
        }
        lastDataSorting.current = overallDataSortState.sorting;
        setDataActivePage(1);
    }, [overallDataSortState.sorting]);

    const lastEventsSorting = useRef(eventDataSortState.sorting);
    useEffect(() => {
        if (lastEventsSorting.current === eventDataSortState.sorting) {
            return;
        }
        lastEventsSorting.current = eventDataSortState.sorting;
        setEventsActivePage(1);
    }, [eventDataSortState.sorting]);
    const [eventSearchText, setEventSearchText] = useState<string | undefined>();
    const [numberFormat, setNumberFormat] = useState<NumberFormat>('abbreviated');
    const abbreviateFigures = numberFormat === 'abbreviated';
    const chartNumberFormatter = abbreviateFigures ? formatNumber : formatFullNumber;
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
        allViewOptions.filter((option) => (
            option.key !== 'map' || (!isMobile && isDefined(displacementCategory))
        ))
    ), [isMobile, displacementCategory]);

    useEffect(() => {
        if (activeView === 'map' && (isMobile || isNotDefined(displacementCategory))) {
            setActiveView('charts');
        }
    }, [isMobile, displacementCategory, activeView]);

    const handleFiltersToggle = useCallback(() => {
        setFiltersExpanded((prev) => !prev);
    }, []);

    const handleCauseChange = useCallback((newVal: Cause | undefined) => {
        setDisplacementCause(newVal);

        if (newVal === 'disaster' || newVal === 'conflict') {
            setTriggerTypes((prev) => prev.filter((key) => key.startsWith(`${newVal}:`)));
        } else {
            setTriggerTypes([]);
        }
        if (newVal) {
            setCombineCauseCharts(false);
        }
        resetTableState();
    }, [setTriggerTypes, resetTableState]);

    const handleTriggerTypesChange = useCallback((newVal: string[]) => {
        const addedKeys = newVal.filter((key) => !triggerTypes.includes(key));

        resetTableState();

        if (isNotDefined(displacementCause) && addedKeys.length > 0) {
            const addedGroup = parseTriggerKey(addedKeys[0])?.group;
            if (isDefined(addedGroup)) {
                setDisplacementCause(addedGroup);
                setCombineCauseCharts(false);
                setTriggerTypes(newVal.filter((key) => key.startsWith(`${addedGroup}:`)));
                return;
            }
        }
        setTriggerTypes(newVal);
    }, [triggerTypes, displacementCause, resetTableState]);

    const handleCountriesChange = useCallback((newVal: string[]) => {
        setCountries(newVal);

        if (newVal.length === 0 || newVal.length > 3) {
            setCombineCountriesChart(false);
        }
        resetTableState();
    }, [setCountries, resetTableState]);

    const handleCountryFocus = useCallback((iso3: string) => {
        handleCountriesChange([iso3]);
    }, [handleCountriesChange]);

    const handleTimeRangeChange = useCallback((newVal: number[]) => {
        setTimeRange(newVal);

        resetTableState();
    }, [resetTableState]);

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
        setActiveView('charts');
        resetTableState();
    }, [
        handleCauseChange,
        handleCountriesChange,
        setTriggerTypes,
        endYear,
        resetTableState,
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
                const year = endYear - index;
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
            if (country?.geographicalGroup && isDefined(country.iso3)) {
                regionNames.set(
                    country.geographicalGroup.id,
                    country.geographicalGroup.name ?? country.geographicalGroup.id,
                );
                const existing = regionIso3Map.get(country.geographicalGroup.id) ?? [];
                existing.push(country.iso3);
                regionIso3Map.set(country.geographicalGroup.id, existing);
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
        resetTableState();
    }, [regionToIso3, resetTableState]);

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
        effectiveCountries.map((iso3) => {
            const option = countriesOptions?.find((item) => item.iso3 === iso3);
            return { iso3, name: option?.idmcShortName ?? iso3 };
        })
    ), [effectiveCountries, countriesOptions]);

    const showCombinedCountries = combineCountriesChart
        || countries.length > 3 || countries.length === 0;

    // triggerTypes is compound-keyed (`disaster:<id>` / `conflict:<id>`) so
    // both groups can coexist in one selection; split back into raw ids here
    const { selectedHazardTypeIds, selectedViolenceSubTypeIds } = useMemo(() => {
        const hazardIds: string[] = [];
        const violenceIds: string[] = [];
        triggerTypes.forEach((key) => {
            const parsed = parseTriggerKey(key);
            if (!parsed) {
                return;
            }
            (parsed.group === 'disaster' ? hazardIds : violenceIds).push(parsed.id);
        });
        return { selectedHazardTypeIds: hazardIds, selectedViolenceSubTypeIds: violenceIds };
    }, [triggerTypes]);

    const statisticsVariables = useMemo(() => ({
        countriesIso3: effectiveCountries,
        combineCountries: showCombinedCountries,
        hazardTypes: isDisasterDataShown ? selectedHazardTypeIds : undefined,
        violenceSubTypes: isConflictDataShown ? selectedViolenceSubTypeIds : undefined,
        startYear: timeRange[0],
        endYear: timeRange[1],
        startYearForTimeseries: timeRange[0] === timeRange[1] ? START_YEAR : timeRange[0],
        endYearForTimeseries: timeRange[1],
        releaseEnvironment: DATA_RELEASE,
        clientId: clientCode,
    }), [
        isDisasterDataShown,
        isConflictDataShown,
        selectedHazardTypeIds,
        selectedViolenceSubTypeIds,
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
                        name: 'Conflict and violence',
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
                        name: `${country} - disasters`,
                    } : undefined,
                    isConflictDataShown ? {
                        dataKey: `conflict-${country}`,
                        key: `conflict-${country}`,
                        stackId: `total-${country}`,
                        fill: conflictColorsRange[index],
                        name: `${country} - conflict and violence`,
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
                    // raw: the combined series adds the two causes together below
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
                    // raw: the combined series adds the two causes together below
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
                        name: 'Conflict and violence',
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
                        name: `${country} - disasters`,
                    } : undefined,
                    isConflictDataShown ? {
                        dataKey: `conflict-${country}`,
                        key: `conflict-${country}`,
                        stackId: `total-${country}`,
                        fill: conflictColorsRange[index],
                        name: `${country} - conflict and violence`,
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
                    // raw: the combined series adds the two causes together below
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
                    // raw: the combined series adds the two causes together below
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

    const triggerTypeOptions = useMemo(
        () => {
            const options = removeNull(
                countryFilterResponse?.giddPublicHazardTypes,
            )?.filter(isDefined) ?? [];

            return [...options].sort((a, b) => compareString(a?.name, b?.name));
        },
        [countryFilterResponse],
    );

    // drives the conflict-by-type breakdown card and the trigger-type filter
    // when a specific cause is 'conflict'
    const violenceSubTypeOptions = useMemo(
        () => {
            const options = removeNull(
                countryFilterResponse?.giddPublicViolenceSubTypes,
            )?.filter(isDefined) ?? [];

            return [...options].sort((a, b) => compareString(a?.name, b?.name));
        },
        [countryFilterResponse],
    );

    // hazard-type and violence-sub-type ids are independent id spaces with no
    // guaranteed disjointness, so each option is wrapped with a compound
    // `group:id` key before the two lists can safely coexist in one selection
    const hazardTriggerOptions = useMemo<TriggerTypeOption[]>(() => (
        triggerTypeOptions.map((option) => ({
            key: makeTriggerKey('disaster', option.id),
            id: option.id,
            label: triggerTypeLabelSelector(option),
            group: 'disaster' as const,
            groupLabel: TRIGGER_GROUP_LABELS.disaster,
        }))
    ), [triggerTypeOptions]);

    const violenceTriggerOptions = useMemo<TriggerTypeOption[]>(() => (
        violenceSubTypeOptions.map((option) => ({
            key: makeTriggerKey('conflict', option.id),
            id: option.id,
            label: violenceSubTypeLabelSelector(option),
            group: 'conflict' as const,
            groupLabel: TRIGGER_GROUP_LABELS.conflict,
        }))
    ), [violenceSubTypeOptions]);

    const triggerTypeOptionsByKey = useMemo(() => {
        const map = new Map<string, TriggerTypeOption>();
        violenceTriggerOptions.forEach((option) => map.set(option.key, option));
        hazardTriggerOptions.forEach((option) => map.set(option.key, option));
        return map;
    }, [hazardTriggerOptions, violenceTriggerOptions]);

    // cause unselected shows both groups (grouped); a specific cause narrows
    // the list to that group's options alone (ungrouped, as before)
    const triggerTypeGrouped = isNotDefined(displacementCause);
    let triggerTypeWidgetOptions: TriggerTypeOption[];
    if (displacementCause === 'disaster') {
        triggerTypeWidgetOptions = hazardTriggerOptions;
    } else if (displacementCause === 'conflict') {
        triggerTypeWidgetOptions = violenceTriggerOptions;
    } else {
        triggerTypeWidgetOptions = [...violenceTriggerOptions, ...hazardTriggerOptions];
    }

    const disaggregationAvailable = isDisaggregationAvailable({
        filterStartYear: timeRange[0],
        filterEndYear: timeRange[1],
    });

    const selectedTriggerType = useMemo(() => {
        if (triggerTypes.length !== 1) {
            return undefined;
        }
        const parsed = parseTriggerKey(triggerTypes[0]);
        return parsed?.group === 'disaster' ? parsed.id : undefined;
    }, [triggerTypes]);

    const handleHazardSelect = useCallback((rawId: string) => {
        const key = makeTriggerKey('disaster', rawId);
        setTriggerTypes((prev) => (
            prev.length === 1 && prev[0] === key ? [] : [key]
        ));
        if (isNotDefined(displacementCause)) {
            setDisplacementCause('disaster');
            setCombineCauseCharts(false);
        }
        resetTableState();
    }, [displacementCause, resetTableState]);

    const selectedViolenceType = useMemo(() => {
        if (triggerTypes.length !== 1) {
            return undefined;
        }
        const parsed = parseTriggerKey(triggerTypes[0]);
        return parsed?.group === 'conflict' ? parsed.id : undefined;
    }, [triggerTypes]);

    const handleViolenceSelect = useCallback((rawId: string) => {
        const key = makeTriggerKey('conflict', rawId);
        setTriggerTypes((prev) => (
            prev.length === 1 && prev[0] === key ? [] : [key]
        ));
        if (isNotDefined(displacementCause)) {
            setDisplacementCause('conflict');
            setCombineCauseCharts(false);
        }
        resetTableState();
    }, [displacementCause, resetTableState]);

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
                heading="Internal displacements"
                headingClassName={styles.slideHeading}
                headingSize="medium"
                headingTooltip={flowDetails}
                headingTooltipTitle="Internal displacements"
                headingDescription={`New movements per year globally, ${domainForCharts[0]}–${domainForCharts[1]}`}
                headingDescriptionClassName={styles.cardDescription}
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
                                tickFormatter={chartNumberFormatter}
                            />
                            <Tooltip
                                formatter={chartNumberFormatter}
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
                headingClassName={styles.slideHeading}
                headingTooltip={stockDetails}
                headingTooltipTitle="Internally displaced people (IDPs)"
                headingSize="medium"
                headingDescription={`People living in displacement at year end globally, as of ${domainForCharts[1]}`}
                headingDescriptionClassName={styles.cardDescription}
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
                                tickFormatter={chartNumberFormatter}
                            />
                            <Tooltip
                                formatter={chartNumberFormatter}
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
            onClick={() => {
                setDisplacementCategory('flow');
                setActiveView('map');
            }}
        >
            show on map →
        </RawButton>
    );
    const showOnMapStock = (
        <RawButton
            name={undefined}
            className={styles.showOnMapButton}
            onClick={() => {
                setDisplacementCategory('stock');
                setActiveView('map');
            }}
        >
            show on map →
        </RawButton>
    );

    // every selected region then every selected country, as display names —
    // shared by the sidebar subtitles (Oxford-joined into scopeLabel) and the
    // Figure analysis header (possessive phrasing)
    const scopeNames = useMemo(() => {
        const regionNames = regions.map((id) => (
            regionOptions.find((item) => item.key === id)?.label ?? id
        ));
        const countryNames = countries.map((iso3) => (
            countriesOptions?.find((item) => item.iso3 === iso3)?.idmcShortName ?? iso3
        ));
        return [...regionNames, ...countryNames];
    }, [countries, countriesOptions, regions, regionOptions]);

    const scopeLabel = buildScopeLabel(scopeNames);

    // trigger-type selections split by group, independent of the cause filter —
    // each feeds its own "... figures are filtered to..." sentence
    const { disasterTriggerLabels, conflictTriggerLabels } = useMemo(() => {
        const disasterLabels: string[] = [];
        const conflictLabels: string[] = [];
        triggerTypes.forEach((key) => {
            const parsed = parseTriggerKey(key);
            const label = triggerTypeOptionsByKey.get(key)?.label;
            if (!parsed || !label) {
                return;
            }
            (parsed.group === 'disaster' ? disasterLabels : conflictLabels).push(label);
        });
        return { disasterTriggerLabels: disasterLabels, conflictTriggerLabels: conflictLabels };
    }, [triggerTypes, triggerTypeOptionsByKey]);

    const glanceDescription = useMemo(() => {
        const yearLabel = timeRange[0] === timeRange[1]
            ? `${timeRange[0]}`
            : `${timeRange[0]}-${timeRange[1]}`;

        const causeClause = buildCausePhrase(displacementCause);

        const noGeoFilter = countries.length === 0 && regions.length === 0;
        const isStockCategory = displacementCategory === 'stock';
        let stats;
        if (displacementCause === 'conflict') {
            stats = conflictStats;
        } else if (displacementCause === 'disaster') {
            stats = disasterStats;
        } else {
            stats = combinedStats;
        }
        const reportingCount = isStockCategory
            ? stats?.totalDisplacementCountries
            : stats?.internalDisplacementCountries;
        const reportingClause = noGeoFilter && isDefined(reportingCount)
            ? ` · ${reportingCount} countries and territories`
            : '';

        // cause-adaptive: the opposite cause's figures aren't shown, so its
        // filter sentence is suppressed even when its trigger types are selected
        const disasterSuffix = displacementCause === 'conflict'
            ? ''
            : buildTriggerFilterSuffix({ cause: 'disaster', labels: disasterTriggerLabels });
        const conflictSuffix = displacementCause === 'disaster'
            ? ''
            : buildTriggerFilterSuffix({ cause: 'conflict', labels: conflictTriggerLabels });

        return `Validated figures${causeClause} for ${yearLabel} ${scopeLabel}`
            + `${reportingClause}.${disasterSuffix}${conflictSuffix}`;
    }, [
        timeRange,
        displacementCause,
        displacementCategory,
        scopeLabel,
        countries,
        regions,
        combinedStats,
        conflictStats,
        disasterStats,
        disasterTriggerLabels,
        conflictTriggerLabels,
    ]);

    const glanceCard = (
        <div className={styles.glanceCard}>
            <Header
                heading="At a glance"
                headingClassName={styles.slideHeading}
                headingSize="small"
                headingDescription={glanceDescription}
                headingDescriptionClassName={styles.glanceDescription}
            />
            <div className={_cs(styles.glanceSection, isFlowSelected && styles.selected)}>
                <Header
                    heading="Internal displacements"
                    headingClassName={styles.slideHeading}
                    headingSize="small"
                    headingTooltip={flowDetails}
                    headingTooltipTitle="Internal displacements"
                    actions={isFlowSelected ? shownOnMap : showOnMapFlow}
                />
                {!displacementCause && (
                    <div className={styles.totalStat}>
                        <Numeral
                            className={styles.totalValue}
                            value={combinedStats?.internalDisplacementsRounded}
                            abbreviate={abbreviateFigures}
                        />
                        <span className={styles.totalSubLabel}>
                            {getCountryCountSubLabel(
                                combinedStats?.internalDisplacementCountries,
                            )}
                        </span>
                    </div>
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
                            abbreviated={abbreviateFigures}
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
                            abbreviated={abbreviateFigures}
                        />
                    )}
                </div>
            </div>
            <div className={_cs(styles.glanceSection, isStockSelected && styles.selected)}>
                <Header
                    heading="Internally displaced people (IDPs)"
                    headingClassName={styles.slideHeading}
                    headingTooltip={stockDetails}
                    headingTooltipTitle="Internally displaced people (IDPs)"
                    headingSize="small"
                    actions={isStockSelected ? shownOnMap : showOnMapStock}
                />
                {!displacementCause && (
                    <div className={styles.totalStat}>
                        <Numeral
                            className={styles.totalValue}
                            value={combinedStats?.totalDisplacementsRounded}
                            abbreviate={abbreviateFigures}
                        />
                        <span className={styles.totalSubLabel}>
                            {getCountryStockCountSubLabel(
                                combinedStats?.totalDisplacementCountries,
                                timeRange[1],
                            )}
                        </span>
                    </div>
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
                            abbreviated={abbreviateFigures}
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
                            abbreviated={abbreviateFigures}
                        />
                    )}
                </div>
            </div>
        </div>
    );

    const glanceSlides: { key: string; content: React.ReactNode }[] = [
        { key: 'glance', content: glanceCard },
    ];
    glanceSlides.push({
        key: 'top-countries',
        content: (
            <TopCountriesCard
                className={styles.glanceCard}
                category={displacementCategory}
                cause={displacementCause}
                countriesIso3={effectiveCountries}
                hazardTypes={isDisasterDataShown ? selectedHazardTypeIds : undefined}
                violenceSubTypes={isConflictDataShown ? selectedViolenceSubTypeIds : undefined}
                startYear={timeRange[0]}
                endYear={timeRange[1]}
                clientCode={clientCode}
                scopeLabel={scopeLabel}
                disasterTriggerLabels={disasterTriggerLabels}
                conflictTriggerLabels={conflictTriggerLabels}
                abbreviate={abbreviateFigures}
                onCountrySelect={handleCountryFocus}
            />
        ),
    });
    glanceSlides.push({
        key: 'hazard-breakdown',
        content: (
            <TypeBreakdownCard
                className={styles.glanceCard}
                variant="disaster"
                category={displacementCategory}
                countriesIso3={effectiveCountries}
                startYear={timeRange[0]}
                endYear={timeRange[1]}
                clientCode={clientCode}
                scopeLabel={scopeLabel}
                abbreviate={abbreviateFigures}
                selectedTypeId={selectedTriggerType}
                selectedTypeIds={selectedHazardTypeIds}
                onTypeSelect={handleHazardSelect}
                noData={!isDisasterDataShown}
            />
        ),
    });
    glanceSlides.push({
        key: 'violence-breakdown',
        content: (
            <TypeBreakdownCard
                className={styles.glanceCard}
                variant="conflict"
                category={displacementCategory}
                countriesIso3={effectiveCountries}
                startYear={timeRange[0]}
                endYear={timeRange[1]}
                clientCode={clientCode}
                scopeLabel={scopeLabel}
                abbreviate={abbreviateFigures}
                selectedTypeId={selectedViolenceType}
                selectedTypeIds={selectedViolenceSubTypeIds}
                onTypeSelect={handleViolenceSelect}
                noData={!isConflictDataShown}
            />
        ),
    });
    glanceSlides.push({
        key: 'figure-analysis',
        content: (
            <FigureAnalysisCard
                className={styles.glanceCard}
                countries={figureAnalysisCountries}
                scopeNames={scopeNames}
                category={displacementCategory}
                year={timeRange[1]}
                clientCode={clientCode}
                abbreviate={abbreviateFigures}
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
            const option = causeOptions.find((item) => item.key === displacementCause);
            filters.push({
                key: 'cause',
                label: option?.label ?? displacementCause,
                onRemove: () => handleCauseChange(undefined),
            });
        }
        triggerTypes.forEach((triggerType) => {
            const option = triggerTypeOptionsByKey.get(triggerType);
            filters.push({
                key: `trigger:${triggerType}`,
                label: option ? option.label : triggerType,
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
        triggerTypeOptionsByKey,
        regions,
        regionOptions,
        applyRegions,
        countries,
        countriesOptions,
        handleCountriesChange,
        handleCauseChange,
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
                                optionsPopupClassName={styles.selectPopup}
                                placeholder="Internal displacements or IDPs"
                                keySelector={categoryKeySelector}
                                labelSelector={categoryLabelSelector}
                                value={displacementCategory}
                                onChange={setDisplacementCategory}
                                options={displacementCategoryOptions}
                            />
                            <SelectInput
                                name="cause"
                                className={_cs(styles.filterCause, styles.filterInput)}
                                optionsPopupClassName={styles.selectPopup}
                                placeholder="All causes"
                                keySelector={causeKeySelector}
                                labelSelector={causeLabelSelector}
                                value={displacementCause}
                                onChange={handleCauseChange}
                                options={causeOptions}
                            />
                            {triggerTypeGrouped ? (
                                <MultiSelectInput
                                    name="triggerType"
                                    className={_cs(styles.filterItem, styles.filterInput)}
                                    optionsPopupClassName={styles.triggerPopup}
                                    placeholder="All trigger types"
                                    value={triggerTypes}
                                    options={triggerTypeWidgetOptions}
                                    keySelector={triggerTypeOptionKeySelector}
                                    labelSelector={triggerTypeOptionLabelSelector}
                                    onChange={handleTriggerTypesChange}
                                    grouped
                                    groupKeySelector={triggerTypeOptionGroupKeySelector}
                                    groupLabelSelector={triggerTypeOptionGroupLabelSelector}
                                />
                            ) : (
                                <MultiSelectInput
                                    name="triggerType"
                                    className={_cs(styles.filterItem, styles.filterInput)}
                                    optionsPopupClassName={styles.selectPopup}
                                    placeholder={
                                        displacementCause === 'conflict'
                                            ? 'All violence types'
                                            : 'All trigger types'
                                    }
                                    value={triggerTypes}
                                    options={triggerTypeWidgetOptions}
                                    keySelector={triggerTypeOptionKeySelector}
                                    labelSelector={triggerTypeOptionLabelSelector}
                                    onChange={handleTriggerTypesChange}
                                />
                            )}
                            <MultiSelectInput
                                name="regions"
                                className={_cs(styles.filterItem, styles.filterInput)}
                                optionsPopupClassName={styles.selectPopup}
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
                                optionsPopupClassName={styles.selectPopup}
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
                                        optionsPopupClassName={styles.selectPopup}
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
                                        optionsPopupClassName={styles.selectPopup}
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
                                name="numberFormat"
                                className={_cs(
                                    styles.filterCause,
                                    styles.filterInput,
                                    styles.filterSegment,
                                )}
                                keySelector={numberFormatKeySelector}
                                labelSelector={numberFormatLabelSelector}
                                options={numberFormatOptions}
                                value={numberFormat}
                                onChange={setNumberFormat}
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
                    {!isMobile && (
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
                                        hazardTypes={
                                            isDisasterDataShown ? selectedHazardTypeIds : undefined
                                        }
                                        violenceSubTypes={
                                            isConflictDataShown
                                                ? selectedViolenceSubTypeIds
                                                : undefined
                                        }
                                        startYear={timeRange[0]}
                                        endYear={timeRange[1]}
                                        clientCode={clientCode}
                                        abbreviate={abbreviateFigures}
                                        onCountryFocus={handleCountryFocus}
                                    />
                                )}
                                {activeView === 'table' && (
                                    <DataTable
                                        overallDataSortState={overallDataSortState}
                                        isConflictDataShown={isConflictDataShown}
                                        isDisasterDataShown={isDisasterDataShown}
                                        category={displacementCategory}
                                        cause={displacementCause}
                                        countriesIso3={effectiveCountries}
                                        hazardTypes={
                                            isDisasterDataShown ? selectedHazardTypeIds : undefined
                                        }
                                        violenceSubTypes={
                                            isConflictDataShown
                                                ? selectedViolenceSubTypeIds
                                                : undefined
                                        }
                                        startYear={timeRange[0]}
                                        endYear={timeRange[1]}
                                        activePage={dataActivePage}
                                        onActivePageChange={setDataActivePage}
                                        clientCode={clientCode}
                                        abbreviate={abbreviateFigures}
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
                                        eventDataSortState={eventDataSortState}
                                        activePage={eventsActivePage}
                                        onActivePageChange={setEventsActivePage}
                                        countriesIso3={effectiveCountries}
                                        hazardTypes={selectedHazardTypeIds}
                                        violenceSubTypes={selectedViolenceSubTypeIds}
                                        startYear={timeRange[0]}
                                        cause={displacementCause}
                                        category={displacementCategory}
                                        endYear={timeRange[1]}
                                        clientCode={clientCode}
                                        searchText={eventSearchText}
                                        abbreviate={abbreviateFigures}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    <div className={styles.sidebar}>
                        <SlideCarousel
                            className={styles.carousel}
                            slides={glanceSlides}
                            expandable={false}
                            fillHeight
                        />

                        <div className={styles.downloadFooter}>
                            <p className={styles.downloadDescription}>
                                <strong>{'IDMC\'s Global Internal Displacement Database (GIDD) '}</strong>
                                {`features validated, annual estimates of internal displacements and internally displaced
                                people (IDPs). For provisional data from the past 180 days, consult the `}
                                <strong>
                                    <a href={iduDashboardLink} target="_parent">Internal Displacement Unit (IDU)</a>
                                </strong>
                                {'. To request an API key, read the '}
                                <strong>
                                    <a href={documentationLink} target="_parent">documentation</a>
                                </strong>
                                .
                            </p>
                            <div className={styles.downloadSection}>
                                <span className={styles.downloadLabel}>
                                    Download current selection
                                </span>
                                <DownloadMenu
                                    cause={displacementCause}
                                    countriesIso3={effectiveCountries}
                                    hazardTypes={selectedHazardTypeIds}
                                    violenceSubTypes={selectedViolenceSubTypeIds}
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
