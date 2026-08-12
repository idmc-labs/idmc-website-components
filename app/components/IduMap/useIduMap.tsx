import React, {
    useState,
    useCallback,
    useMemo,
} from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    LngLatBounds,
} from 'mapbox-gl';
import {
    IoSearchOutline,
    IoRefreshOutline,
    IoFilterOutline,
    IoChevronDownOutline,
    IoChevronUpOutline,
    // IoShareSocialOutline,
    IoInformationCircleOutline,
} from 'react-icons/io5';
import {
    Button,
    TextInput,
    SegmentInput,
    MultiSelectInput,
    DateRangeDualInput,
    Modal,
} from '@togglecorp/toggle-ui';
import {
    _cs,
    isDefined,
    isNotDefined,
    caseInsensitiveSubmatch,
    compareString,
    mapToList,
} from '@togglecorp/fujs';

import {
    IduDataQuery,
    IduDataQueryVariables,
    GiddFilterOptionsQuery,
    GiddFilterOptionsQueryVariables,
} from '#generated/types';

import Message from '#components/Message';
import RawButton from '#components/RawButton';
import SlideCarousel from '#components/SlideCarousel';
import useBooleanState from '#hooks/useBooleanState';

import { suffixDrupalEndpoint } from '#utils/common';

import RawIduMap from './RawIduMap';
import IduTable from './IduTable';
import RecentEvents from './RecentEvents';
import TopCountries from './TopCountries';
import DisasterBreakdown from './DisasterBreakdown';
import ConflictBreakdown from './ConflictBreakdown';
import LargestEvents from './LargestEvents';
import FilterPill from './FilterPill';
import StatBar from './StatBar';

import styles from './styles.css';

const giddLink = suffixDrupalEndpoint('/database/displacement-data');

const IDU_DATA = gql`
    query IduData($clientId: String!) {
        idu(clientId: $clientId) @rest(
            type: "[IduData]",
            method: "GET",
            endpoint: "helix",
            path: "idus/last-180-days/?client_id={args.clientId}"
        ) {
            id
            country
            iso3
            latitude
            longitude
            centroid
            role
            displacement_type
            qualifier
            figure
            displacement_date
            displacement_start_date
            displacement_end_date
            year
            event_id
            event_name
            event_codes
            event_code_types
            event_start_date
            event_end_date
            category
            subcategory
            type
            subtype
            standard_popup_text
            standard_info_text
            old_id
            sources
            source_url
            locations_name
            locations_coordinates
            locations_accuracy
            locations_type
            displacement_occurred
            created_at
        }
    }
`;

const IDU_FILTER_OPTIONS = gql`
    query IduFilterOptions($clientId: String!) {
        giddPublicCountries(clientId: $clientId) {
            id
            idmcShortName
            iso3
            region {
                id
                name
            }
        }
        giddPublicHazardTypes(clientId: $clientId) {
            id
            name
        }
    }
`;

type CauseKey = 'all' | 'Conflict' | 'Disaster';
interface CauseOption {
    key: CauseKey;
    label: string;
}
const causeKeySelector = (option: CauseOption) => option.key;
const causeLabelSelector = (option: CauseOption) => option.label;
const causeOptions: CauseOption[] = [
    { key: 'all', label: 'All' },
    { key: 'Conflict', label: 'Conflict' },
    { key: 'Disaster', label: 'Disasters' },
];

type ViewKey = 'map' | 'table';
interface ViewOption {
    key: ViewKey;
    label: string;
}
const viewKeySelector = (option: ViewOption) => option.key;
const viewLabelSelector = (option: ViewOption) => option.label;
const viewOptions: ViewOption[] = [
    { key: 'map', label: 'Map' },
    { key: 'table', label: 'Table' },
];

interface Option {
    key: string;
    label: string;
}
const optionKeySelector = (option: Option) => option.key;
const optionLabelSelector = (option: Option) => option.label;

interface LocationOption {
    // key is prefixed: 'r:<regionId>' for a region, 'c:<iso3>' for a country
    key: string;
    label: string;
    // groupKey is sort-prefixed so "Regions" always renders before "Countries"
    groupKey: string;
    groupLabel: string;
}
const locationKeySelector = (option: LocationOption) => option.key;
const locationLabelSelector = (option: LocationOption) => option.label;
const locationGroupKeySelector = (option: LocationOption) => option.groupKey;
const locationGroupLabelSelector = (option: LocationOption) => option.groupLabel;

const TODAY = new Date();
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toDateInputValue(date: Date) {
    return date.toISOString().split('T')[0];
}

const defaultEndDate = toDateInputValue(TODAY);
const defaultStartDateObj = new Date(TODAY);
defaultStartDateObj.setDate(defaultStartDateObj.getDate() - 180);
const defaultStartDate = toDateInputValue(defaultStartDateObj);

function triggerDownload(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function escapeCsvValue(value: unknown) {
    if (isNotDefined(value)) {
        return '';
    }
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /["\r\n,]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCsv(rows: Record<string, unknown>[]) {
    if (rows.length === 0) {
        return '';
    }
    const keys = Object.keys(rows[0]).filter((key) => key !== '__typename');
    const lines = rows.map(
        (row) => keys.map((key) => escapeCsvValue(row[key])).join(','),
    );
    return [keys.map(escapeCsvValue).join(','), ...lines].join('\n');
}

function useIduMap(
    clientCode: string,
    boundingBox?: LngLatBounds | undefined,
    iso3?: string,
) {
    const [searchText, setSearchText] = useState<string | undefined>();
    const [cause, setCause] = useState<CauseKey>('all');
    const [triggerTypes, setTriggerTypes] = useState<string[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string | undefined>(defaultStartDate);
    const [endDate, setEndDate] = useState<string | undefined>(defaultEndDate);
    const [mapOrTable, setMapOrTable] = useState<ViewKey>('map');
    const [
        selectedEvent,
        setSelectedEvent,
    ] = useState<{ id: number; name: string } | undefined>();

    const {
        previousData: previousIduData,
        data: iduData = previousIduData,
        loading,
        error,
    } = useQuery<IduDataQuery, IduDataQueryVariables>(
        IDU_DATA,
        {
            variables: {
                clientId: clientCode,
            },
        },
    );

    const {
        data: filterOptionsData,
    } = useQuery<GiddFilterOptionsQuery, GiddFilterOptionsQueryVariables>(
        IDU_FILTER_OPTIONS,
        {
            variables: {
                clientId: clientCode,
            },
            context: {
                clientName: 'helix',
            },
        },
    );

    const hazardOptions = useMemo<Option[]>(() => (
        (filterOptionsData?.giddPublicHazardTypes ?? [])
            .filter(isDefined)
            .map((hazard) => ({ key: hazard.name, label: hazard.name }))
            .sort((a, b) => compareString(a.label, b.label))
    ), [filterOptionsData]);

    const {
        locationOptions,
        regionToIso3,
    } = useMemo(() => {
        const countriesData = filterOptionsData?.giddPublicCountries ?? [];
        const regionNames: Record<string, string> = {};
        const regionIso3Map = new Map<string, string[]>();
        countriesData.forEach((country) => {
            if (country.region && isDefined(country.iso3)) {
                regionNames[country.region.id] = country.region.name ?? country.region.id;
                const existing = regionIso3Map.get(country.region.id) ?? [];
                existing.push(country.iso3);
                regionIso3Map.set(country.region.id, existing);
            }
        });

        const regionOpts: LocationOption[] = mapToList(
            regionNames,
            (name, id) => ({
                key: `r:${id}`,
                label: name,
                groupKey: '1-regions',
                groupLabel: 'Regions',
            }),
        ).sort((a, b) => compareString(a.label, b.label));

        const countryOpts: LocationOption[] = countriesData
            .filter((country) => isDefined(country.iso3))
            .map((country) => ({
                key: `c:${country.iso3}`,
                label: country.idmcShortName ?? country.iso3 ?? '',
                groupKey: '2-countries',
                groupLabel: 'Countries',
            }))
            .sort((a, b) => compareString(a.label, b.label));

        return {
            locationOptions: [...regionOpts, ...countryOpts],
            regionToIso3: regionIso3Map,
        };
    }, [filterOptionsData]);

    const idus = useMemo(() => (
        iso3
            ? iduData?.idu?.filter((item) => item.iso3 === iso3)
            : iduData?.idu
    ), [iso3, iduData]);

    const idusForMap = useMemo(() => {
        const allowedIso3 = locations.length > 0
            ? new Set<string>(
                locations.flatMap((key) => {
                    if (key.startsWith('c:')) {
                        return [key.slice(2)];
                    }
                    if (key.startsWith('r:')) {
                        return regionToIso3.get(key.slice(2)) ?? [];
                    }
                    return [];
                }),
            )
            : undefined;

        return idus?.filter((d) => {
            if (isNotDefined(d.displacement_date)) {
                return false;
            }

            if (selectedEvent && d.event_id !== selectedEvent.id) {
                return false;
            }

            if (cause !== 'all' && d.displacement_type !== cause) {
                return false;
            }

            if (
                triggerTypes.length > 0
                && (isNotDefined(d.type) || !triggerTypes.includes(d.type))
            ) {
                return false;
            }

            if (allowedIso3 && (isNotDefined(d.iso3) || !allowedIso3.has(d.iso3))) {
                return false;
            }

            const search = searchText?.trim();
            if (search) {
                const haystack = `${d.event_name ?? ''} ${d.country ?? ''} ${d.locations_name ?? ''}`;
                if (!caseInsensitiveSubmatch(haystack, search)) {
                    return false;
                }
            }

            const displacementTime = new Date(d.displacement_date).getTime();
            if (startDate && displacementTime < new Date(startDate).getTime()) {
                return false;
            }
            if (endDate && displacementTime > (new Date(endDate).getTime() + DAY_IN_MS - 1)) {
                return false;
            }

            return true;
        });
    }, [
        idus,
        selectedEvent,
        cause,
        triggerTypes,
        locations,
        regionToIso3,
        searchText,
        startDate,
        endDate,
    ]);

    const handleDownloadGeojson = useCallback(() => {
        if (isNotDefined(idusForMap)) {
            return;
        }
        const features = idusForMap
            .filter((item) => isDefined(item.longitude) && isDefined(item.latitude))
            .map((item) => {
                const {
                    __typename,
                    ...properties
                } = item as (typeof item & { __typename: string });
                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [item.longitude, item.latitude],
                    },
                    properties,
                };
            });
        const geojson = { type: 'FeatureCollection', features };
        triggerDownload(
            JSON.stringify(geojson),
            'idu-data.geojson',
            'application/geo+json',
        );
    }, [idusForMap]);

    const handleDownloadCsv = useCallback(() => {
        if (isNotDefined(idusForMap)) {
            return;
        }
        const csv = toCsv(idusForMap as unknown as Record<string, unknown>[]);
        triggerDownload(csv, 'idu-data.csv', 'text/csv;charset=utf-8');
    }, [idusForMap]);

    const handleReset = useCallback(() => {
        setSearchText(undefined);
        setCause('all');
        setTriggerTypes([]);
        setLocations([]);
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        setSelectedEvent(undefined);
    }, []);

    const handleCountrySelect = useCallback((countryIso3: string) => {
        const key = `c:${countryIso3}`;
        setLocations((prev) => (prev.length === 1 && prev[0] === key ? [] : [key]));
    }, []);

    const handleCountryFocus = useCallback((countryIso3: string) => {
        setLocations([`c:${countryIso3}`]);
    }, []);

    const handleTriggerSelect = useCallback((triggerType: string) => {
        setTriggerTypes((prev) => (
            prev.length === 1 && prev[0] === triggerType ? [] : [triggerType]
        ));
    }, []);

    const handleEventSelect = useCallback((eventId: number, eventName: string) => {
        setSelectedEvent((prev) => (
            prev?.id === eventId ? undefined : { id: eventId, name: eventName }
        ));
    }, []);

    const handleEventClear = useCallback(() => {
        setSelectedEvent(undefined);
    }, []);

    // TODO: re-enable "Share this view" (encode the active filters into the URL)
    // const handleShare = useCallback(() => {
    //     if (navigator.clipboard) {
    //         navigator.clipboard.writeText(window.location.href);
    //     }
    // }, []);

    const [
        definitionsShown,
        showDefinitions,
        hideDefinitions,
    ] = useBooleanState(false);

    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const handleFiltersToggle = useCallback(() => {
        setFiltersExpanded((prev) => !prev);
    }, []);

    if (error) {
        return {
            idus,
            widget: <Message message="Some error occurred!" />,
        };
    }

    const appliedFilterCount = (
        (searchText && searchText.trim() ? 1 : 0)
        + (cause !== 'all' ? 1 : 0)
        + (triggerTypes.length > 0 ? 1 : 0)
        + (locations.length > 0 ? 1 : 0)
        + (startDate !== defaultStartDate || endDate !== defaultEndDate ? 1 : 0)
        + (selectedEvent ? 1 : 0)
    );

    const selectedIso3 = locations.length === 1 && locations[0].startsWith('c:')
        ? locations[0].slice(2)
        : undefined;
    const selectedTriggerType = triggerTypes.length === 1 ? triggerTypes[0] : undefined;

    const activeFilters: { key: string; label: string; onRemove: () => void }[] = [];
    const trimmedSearch = searchText?.trim();
    if (trimmedSearch) {
        activeFilters.push({
            key: 'search',
            label: trimmedSearch,
            onRemove: () => setSearchText(undefined),
        });
    }
    if (cause !== 'all') {
        const causeOption = causeOptions.find((option) => option.key === cause);
        activeFilters.push({
            key: 'cause',
            label: causeOption?.label ?? cause,
            onRemove: () => setCause('all'),
        });
    }
    triggerTypes.forEach((triggerType) => {
        activeFilters.push({
            key: `trigger:${triggerType}`,
            label: triggerType,
            onRemove: () => setTriggerTypes((prev) => prev.filter((item) => item !== triggerType)),
        });
    });
    locations.forEach((location) => {
        const option = locationOptions.find((item) => item.key === location);
        activeFilters.push({
            key: `location:${location}`,
            label: option?.label ?? location,
            onRemove: () => setLocations((prev) => prev.filter((item) => item !== location)),
        });
    });
    if (startDate !== defaultStartDate || endDate !== defaultEndDate) {
        activeFilters.push({
            key: 'date',
            label: `${startDate ?? ''} – ${endDate ?? ''}`,
            onRemove: () => {
                setStartDate(defaultStartDate);
                setEndDate(defaultEndDate);
            },
        });
    }

    const slides: { key: string; content: React.ReactNode }[] = [
        {
            key: 'recent-events',
            content: (
                <RecentEvents
                    idus={idusForMap}
                    onEventSelect={handleEventSelect}
                    selectedEventId={selectedEvent?.id}
                />
            ),
        },
        {
            key: 'top-countries',
            content: (
                <TopCountries
                    idus={idusForMap}
                    onCountrySelect={handleCountrySelect}
                    selectedIso3={selectedIso3}
                />
            ),
        },
        {
            key: 'disaster-breakdown',
            content: (
                <DisasterBreakdown
                    idus={idusForMap}
                    onTriggerSelect={handleTriggerSelect}
                    selectedTriggerType={selectedTriggerType}
                />
            ),
        },
        {
            key: 'conflict-breakdown',
            content: <ConflictBreakdown idus={idusForMap} />,
        },
        {
            key: 'largest-events',
            content: (
                <LargestEvents
                    idus={idusForMap}
                    startDate={startDate}
                    endDate={endDate}
                    onEventSelect={handleEventSelect}
                    selectedEventId={selectedEvent?.id}
                />
            ),
        },
    ];

    const widget = (
        <div className={styles.dashboard}>
            <div className={styles.topBar}>
                {selectedEvent && (
                    <FilterPill
                        className={styles.eventPill}
                        label={selectedEvent.name}
                        onRemove={handleEventClear}
                    />
                )}
                <div className={styles.topActions}>
                    <Button
                        name={undefined}
                        onClick={handleReset}
                        icons={<IoRefreshOutline />}
                        transparent
                    >
                        Reset filters
                    </Button>
                    {/* Share this view is temporarily disabled
                    <Button
                        name={undefined}
                        onClick={handleShare}
                        icons={<IoShareSocialOutline />}
                        transparent
                    >
                        Share this view
                    </Button>
                    */}
                </div>
            </div>
            <div className={styles.filters}>
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
                <div className={_cs(styles.filterBar, filtersExpanded && styles.filterBarExpanded)}>
                    <div className={styles.leftFilters}>
                        <TextInput
                            className={styles.search}
                            name="search"
                            placeholder="Search events..."
                            value={searchText}
                            onChange={setSearchText}
                            icons={<IoSearchOutline />}
                        />
                        <SegmentInput
                            className={styles.cause}
                            name="cause"
                            options={causeOptions}
                            keySelector={causeKeySelector}
                            labelSelector={causeLabelSelector}
                            value={cause}
                            onChange={setCause}
                        />
                        <MultiSelectInput
                            className={styles.triggerTypes}
                            name="triggerTypes"
                            placeholder="All trigger types"
                            options={hazardOptions}
                            keySelector={optionKeySelector}
                            labelSelector={optionLabelSelector}
                            value={triggerTypes}
                            onChange={setTriggerTypes}
                        />
                        {isNotDefined(iso3) && (
                            <MultiSelectInput
                                className={styles.countries}
                                name="locations"
                                placeholder="All countries and regions"
                                options={locationOptions}
                                keySelector={locationKeySelector}
                                labelSelector={locationLabelSelector}
                                value={locations}
                                onChange={setLocations}
                                grouped
                                groupKeySelector={locationGroupKeySelector}
                                groupLabelSelector={locationGroupLabelSelector}
                            />
                        )}
                    </div>
                    <DateRangeDualInput
                        className={styles.dateRange}
                        fromName="startDate"
                        toName="endDate"
                        fromValue={startDate}
                        toValue={endDate}
                        fromOnChange={setStartDate}
                        toOnChange={setEndDate}
                    />
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
            <div className={styles.panes}>
                <div className={styles.leftPane}>
                    {mapOrTable === 'map' ? (
                        <RawIduMap
                            idus={idusForMap}
                            boundingBox={boundingBox}
                            onCountryFocus={isNotDefined(iso3) ? handleCountryFocus : undefined}
                        />
                    ) : (
                        <IduTable idus={idusForMap} />
                    )}
                    <SegmentInput
                        className={styles.viewToggle}
                        name="view"
                        options={viewOptions}
                        keySelector={viewKeySelector}
                        labelSelector={viewLabelSelector}
                        value={mapOrTable}
                        onChange={setMapOrTable}
                    />
                </div>
                <div className={styles.rightPane}>
                    <StatBar idus={idusForMap} />
                    <SlideCarousel
                        className={styles.carousel}
                        slides={slides}
                        fillHeight
                        expandable={false}
                        pagerExtra={(
                            <RawButton
                                name={undefined}
                                className={styles.definitions}
                                onClick={showDefinitions}
                            >
                                <IoInformationCircleOutline />
                                Definitions
                            </RawButton>
                        )}
                    />
                    <div className={styles.rightFooter}>
                        <p className={styles.footerText}>
                            {/* eslint-disable-next-line max-len */}
                            IDMC&apos;s Internal Displacement Updates (IDU) are preliminary estimates of internal displacement events reported in the last 180 days, updated daily. Curated and validated estimates are published in the
                            {' '}
                            <a href={giddLink} target="_parent">
                                Global Internal Displacement Database (GIDD)
                            </a>
                            .
                        </p>
                        <div className={styles.downloadRow}>
                            <span className={styles.downloadLabel}>
                                Download current selection
                            </span>
                            <Button
                                className={styles.downloadButton}
                                name={undefined}
                                onClick={handleDownloadGeojson}
                                disabled={loading || isNotDefined(idusForMap)}
                            >
                                GeoJSON
                            </Button>
                            <Button
                                className={styles.downloadButton}
                                name={undefined}
                                onClick={handleDownloadCsv}
                                disabled={loading || isNotDefined(idusForMap)}
                            >
                                Excel
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {definitionsShown && (
                <Modal
                    heading="Definitions"
                    onClose={hideDefinitions}
                    size="small"
                >
                    <p>
                        {/* eslint-disable-next-line max-len */}
                        Definitions of the terms used in this dashboard (cause, trigger type and figures) will be listed here.
                    </p>
                </Modal>
            )}
        </div>
    );

    return {
        idus,
        widget,
    };
}

export default useIduMap;
