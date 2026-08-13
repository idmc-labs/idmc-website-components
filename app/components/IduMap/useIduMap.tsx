import React, {
    useState,
    useCallback,
    useMemo,
    useRef,
} from 'react';
import { LngLatLike } from 'mapbox-gl';
import {
    gql,
    useQuery,
} from '@apollo/client';
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
    Modal,
} from '@togglecorp/toggle-ui';
import {
    _cs,
    isDefined,
    isNotDefined,
    isTruthyString,
    caseInsensitiveSubmatch,
    compareString,
} from '@togglecorp/fujs';

import {
    IduDataQuery,
    IduDataQueryVariables,
} from '#generated/types';

import Message from '#components/Message';
import RawButton from '#components/RawButton';
import SlideCarousel from '#components/SlideCarousel';
import useBooleanState from '#hooks/useBooleanState';
import useDebouncedValue from '#hooks/useDebouncedValue';

import { suffixDrupalEndpoint } from '#utils/common';

import RawIduMap, {
    MapSelection,
    PopupProperties,
    iduToPopupProperties,
} from './RawIduMap';
import IduTable from './IduTable';
import DateFilter from './DateFilter';
import RecentEvents from './RecentEvents';
import TopCountries from './TopCountries';
import Breakdown from './Breakdown';
import LargestEvents from './LargestEvents';
import FilterPill from './FilterPill';
import StatBar from './StatBar';

import styles from './styles.css';

const giddLink = suffixDrupalEndpoint('/database/displacement-data');
// TODO: point this at the real IDU API documentation URL
const documentationLink = suffixDrupalEndpoint('/database/api-documentation');

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
            violence_type
            violence_subtype
            context_of_violence
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

interface ActiveFilter {
    key: string;
    label: string;
    onRemove: () => void;
}

interface TriggerOption {
    // the raw hazard type / disaster category / violence name (matched in the filter)
    key: string;
    label: string;
    // groupKey is sort-prefixed so "Disaster" always renders before "Conflict"
    groupKey: string;
    groupLabel: string;
}
const triggerKeySelector = (option: TriggerOption) => option.key;
const triggerLabelSelector = (option: TriggerOption) => option.label;
const triggerGroupKeySelector = (option: TriggerOption) => option.groupKey;
const triggerGroupLabelSelector = (option: TriggerOption) => option.groupLabel;

const TRIGGER_GROUP_DISASTER = 'Disaster';
const TRIGGER_GROUP_CONFLICT = 'Conflict and Violence';

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
    iso3?: string,
) {
    // searchInput drives the text field; the debounced value drives filtering
    const [searchInput, setSearchInput] = useState<string | undefined>();
    const searchText = useDebouncedValue(searchInput, 300);
    const [cause, setCause] = useState<CauseKey>('all');
    const [triggerTypes, setTriggerTypes] = useState<string[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string | undefined>(defaultStartDate);
    const [endDate, setEndDate] = useState<string | undefined>(defaultEndDate);
    const [mapOrTable, setMapOrTable] = useState<ViewKey>('map');
    // the open map popup lives here so events and filter changes can drive it
    const [mapSelection, setMapSelection] = useState<MapSelection | undefined>();
    const [flyTo, setFlyTo] = useState<LngLatLike | undefined>();
    // the event row highlighted in the pane == the event whose popup is open
    const selectedEventId = mapSelection?.eventId;

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

    const idus = useMemo(() => (
        iso3
            ? iduData?.idu?.filter((item) => item.iso3 === iso3)
            : iduData?.idu
    ), [iso3, iduData]);

    // built from the data: hazard types (Disaster) + violence names (Conflict),
    // limited to the groups matching the cause selection
    const triggerOptions = useMemo<TriggerOption[]>(() => {
        const hazardTypes = new Set<string>();
        const violenceNames = new Set<string>();
        (idus ?? []).forEach((d) => {
            if (d.displacement_type === 'Disaster' && isTruthyString(d.type)) {
                hazardTypes.add(d.type);
            }
            if (d.displacement_type === 'Conflict' && isTruthyString(d.violence_type)) {
                violenceNames.add(d.violence_type);
            }
        });

        const disasterOpts: TriggerOption[] = [...hazardTypes]
            .sort(compareString)
            .map((name) => ({
                key: name,
                label: name,
                groupKey: `1-${TRIGGER_GROUP_DISASTER}`,
                groupLabel: TRIGGER_GROUP_DISASTER,
            }));
        const conflictOpts: TriggerOption[] = [...violenceNames]
            .sort(compareString)
            .map((name) => ({
                key: name,
                label: name,
                groupKey: `2-${TRIGGER_GROUP_CONFLICT}`,
                groupLabel: TRIGGER_GROUP_CONFLICT,
            }));

        if (cause === 'Disaster') {
            return disasterOpts;
        }
        if (cause === 'Conflict') {
            return conflictOpts;
        }
        return [...disasterOpts, ...conflictOpts];
    }, [idus, cause]);

    // Country options are built from the data itself (keyed 'c:<iso3>').
    const countryOptions = useMemo<Option[]>(() => {
        const byIso3 = new Map<string, string>();
        (idus ?? []).forEach((d) => {
            if (isTruthyString(d.iso3)) {
                byIso3.set(d.iso3, isTruthyString(d.country) ? d.country : d.iso3);
            }
        });
        return [...byIso3.entries()]
            .map(([code, name]) => ({ key: `c:${code}`, label: name }))
            .sort((a, b) => compareString(a.label, b.label));
    }, [idus]);

    const idusForMap = useMemo(() => {
        const allowedIso3 = locations.length > 0
            ? new Set<string>(locations.map((key) => key.slice(2)))
            : undefined;

        return idus?.filter((d) => {
            if (isNotDefined(d.displacement_date)) {
                return false;
            }

            if (cause !== 'all' && d.displacement_type !== cause) {
                return false;
            }

            // a selected trigger matches the disaster hazard type or the
            // conflict violence name of the record
            if (
                triggerTypes.length > 0
                && !triggerTypes.some((value) => (
                    d.type === value
                    || d.violence_type === value
                ))
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
        cause,
        triggerTypes,
        locations,
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

    const prevIdusForMap = useRef(idusForMap);
    if (prevIdusForMap.current !== idusForMap) {
        prevIdusForMap.current = idusForMap;
        if (isDefined(mapSelection)) {
            setMapSelection(undefined);
            setFlyTo(undefined);
        }
    }

    const handleReset = useCallback(() => {
        setSearchInput(undefined);
        setCause('all');
        setTriggerTypes([]);
        setLocations([]);
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
    }, []);

    const handleDateRangeChange = useCallback((
        start: string | undefined,
        end: string | undefined,
    ) => {
        setStartDate(start);
        setEndDate(end);
    }, []);

    // changing the cause changes which trigger groups are available, so drop the
    // current trigger selection to avoid a now-hidden filter lingering
    const handleCauseChange = useCallback((value: CauseKey) => {
        setCause(value);
        setTriggerTypes([]);
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

    const handleEventSelect = useCallback((eventId: number) => {
        setMapOrTable('map');
        const records = (idusForMap ?? []).filter((d) => (
            d.event_id === eventId
            && isDefined(d.longitude)
            && isDefined(d.latitude)
        ));
        if (records.length === 0) {
            return;
        }
        // open the popup on the event's largest record, and ease the map there
        const record = records.reduce((a, b) => (b.figure > a.figure ? b : a));
        const lngLat: LngLatLike = [record.longitude as number, record.latitude as number];
        setMapSelection({
            lngLat,
            properties: [iduToPopupProperties(record)],
            eventId,
        });
        setFlyTo(lngLat);
    }, [idusForMap]);

    const handleMapPointClick = useCallback((lngLat: LngLatLike, properties: PopupProperties) => {
        // a raw map click isn't tied to an event row, so no eventId / fly
        setFlyTo(undefined);
        // stack cards for overlapping points (same click fires once per feature)
        setMapSelection((prev) => (
            prev && prev.lngLat === lngLat
                ? { lngLat, properties: [...prev.properties, properties] }
                : { lngLat, properties: [properties] }
        ));
    }, []);

    const handleMapPopupClose = useCallback(() => {
        setMapSelection(undefined);
        setFlyTo(undefined);
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

    const appliedFilterCount = (
        (searchText && searchText.trim() ? 1 : 0)
        + (cause !== 'all' ? 1 : 0)
        + (triggerTypes.length > 0 ? 1 : 0)
        + (locations.length > 0 ? 1 : 0)
        + (startDate !== defaultStartDate || endDate !== defaultEndDate ? 1 : 0)
    );

    const selectedIso3 = locations.length === 1 && locations[0].startsWith('c:')
        ? locations[0].slice(2)
        : undefined;
    const selectedTriggerType = triggerTypes.length === 1 ? triggerTypes[0] : undefined;

    const activeFilters = useMemo<ActiveFilter[]>(() => {
        const filters: ActiveFilter[] = [];
        const trimmedSearch = searchText?.trim();
        if (trimmedSearch) {
            filters.push({
                key: 'search',
                label: trimmedSearch,
                onRemove: () => setSearchInput(undefined),
            });
        }
        if (cause !== 'all') {
            const causeOption = causeOptions.find((option) => option.key === cause);
            filters.push({
                key: 'cause',
                label: causeOption?.label ?? cause,
                onRemove: () => setCause('all'),
            });
        }
        triggerTypes.forEach((triggerType) => {
            filters.push({
                key: `trigger:${triggerType}`,
                label: triggerType,
                onRemove: () => setTriggerTypes(
                    (prev) => prev.filter((item) => item !== triggerType),
                ),
            });
        });
        locations.forEach((location) => {
            const option = countryOptions.find((item) => item.key === location);
            filters.push({
                key: `location:${location}`,
                label: option?.label ?? location,
                onRemove: () => setLocations((prev) => prev.filter((item) => item !== location)),
            });
        });
        if (startDate !== defaultStartDate || endDate !== defaultEndDate) {
            filters.push({
                key: 'date',
                label: `${startDate ?? ''} – ${endDate ?? ''}`,
                onRemove: () => {
                    setStartDate(defaultStartDate);
                    setEndDate(defaultEndDate);
                },
            });
        }
        return filters;
    }, [searchText, cause, triggerTypes, locations, startDate, endDate, countryOptions]);

    if (error) {
        return {
            idus,
            widget: <Message message="Some error occurred!" />,
        };
    }

    const slides: { key: string; content: React.ReactNode }[] = [
        {
            key: 'recent-events',
            content: (
                <RecentEvents
                    idus={idusForMap}
                    onEventSelect={handleEventSelect}
                    selectedEventId={selectedEventId}
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
                <Breakdown
                    idus={idusForMap}
                    variant="disaster"
                    heading="Internal displacements by disasters"
                    description="Breakdown by hazard type."
                    onTriggerSelect={handleTriggerSelect}
                    selectedTriggerType={selectedTriggerType}
                />
            ),
        },
        {
            key: 'conflict-breakdown',
            content: (
                <Breakdown
                    idus={idusForMap}
                    variant="conflict"
                    heading="Internal displacements by conflict and violence"
                    description="Breakdown by type of conflict or violence."
                />
            ),
        },
        {
            key: 'largest-events',
            content: (
                <LargestEvents
                    idus={idusForMap}
                    startDate={startDate}
                    endDate={endDate}
                    onEventSelect={handleEventSelect}
                    selectedEventId={selectedEventId}
                />
            ),
        },
    ];

    const widget = (
        <div className={styles.dashboard}>
            <div className={styles.topBar}>
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
                            className={_cs(styles.search, styles.filterInput)}
                            name="search"
                            placeholder="Search events..."
                            value={searchInput}
                            onChange={setSearchInput}
                            icons={<IoSearchOutline />}
                        />
                        <SegmentInput
                            className={_cs(styles.cause, styles.filterInput, styles.filterSegment)}
                            name="cause"
                            options={causeOptions}
                            keySelector={causeKeySelector}
                            labelSelector={causeLabelSelector}
                            value={cause}
                            onChange={handleCauseChange}
                        />
                        <MultiSelectInput
                            className={_cs(styles.triggerTypes, styles.filterInput)}
                            optionsPopupClassName={styles.triggerPopup}
                            name="triggerTypes"
                            placeholder="All trigger types"
                            options={triggerOptions}
                            keySelector={triggerKeySelector}
                            labelSelector={triggerLabelSelector}
                            value={triggerTypes}
                            onChange={setTriggerTypes}
                            grouped
                            groupKeySelector={triggerGroupKeySelector}
                            groupLabelSelector={triggerGroupLabelSelector}
                        />
                        {isNotDefined(iso3) && (
                            <MultiSelectInput
                                className={_cs(styles.countries, styles.filterInput)}
                                name="locations"
                                placeholder="All countries"
                                options={countryOptions}
                                keySelector={optionKeySelector}
                                labelSelector={optionLabelSelector}
                                value={locations}
                                onChange={setLocations}
                            />
                        )}
                    </div>
                    <DateFilter
                        className={styles.dateRange}
                        startDate={startDate}
                        endDate={endDate}
                        minDate={defaultStartDate}
                        maxDate={defaultEndDate}
                        onChange={handleDateRangeChange}
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
                            onCountryFocus={isNotDefined(iso3) ? handleCountryFocus : undefined}
                            selection={mapSelection}
                            flyTo={flyTo}
                            onPointClick={handleMapPointClick}
                            onClose={handleMapPopupClose}
                        />
                    ) : (
                        <IduTable idus={idusForMap} />
                    )}
                    <SegmentInput
                        className={_cs(styles.viewToggle, styles.filterInput, styles.filterSegment)}
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
                            IDMC&apos;s Internal Displacement Updates (IDU) are preliminary estimates of internal displacement events reported in the last 180 days. This provisional data is updated daily with new available data. Validated, annual estimates are published in the
                            {' '}
                            <a href={giddLink} target="_parent">
                                Global Internal Displacement Database (GIDD)
                            </a>
                            . To request an API key, read the
                            {' '}
                            <a href={documentationLink} target="_parent">
                                documentation
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
                        <strong>Internal displacements</strong>
                        {/* eslint-disable-next-line max-len */}
                        {' — the number of times people are forced to move inside their country during a specific time period.'}
                    </p>
                    <p>
                        <strong>Internally displaced persons (IDPs)</strong>
                        {/* eslint-disable-next-line max-len */}
                        {' — the number of people living in internal displacement at a specific point in time.'}
                    </p>
                    <p>
                        The IDU reports
                        {' '}
                        <strong>internal displacements only</strong>
                        . IDP figures are included in the
                        {' '}
                        <a href={giddLink} target="_parent">GIDD</a>
                        {' only.'}
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
