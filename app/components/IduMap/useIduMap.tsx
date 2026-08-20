import React, {
    useState,
    useCallback,
    useMemo,
    useRef,
} from 'react';
import { LngLatLike, LngLatBoundsLike } from 'mapbox-gl';
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
    SelectInput,
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import {
    _cs,
    isDefined,
    isNotDefined,
    isTruthyString,
    caseInsensitiveSubmatch,
    compareString,
    formatDateToString,
    decodeDate,
} from '@togglecorp/fujs';

import {
    IduDataQuery,
    IduDataQueryVariables,
    IduReferencesQuery,
    IduReferencesQueryVariables,
} from '#generated/types';

import Message from '#components/Message';
import RawButton from '#components/RawButton';
import SlideCarousel from '#components/SlideCarousel';
import TooltipIcon from '#components/TooltipIcon';
import useDebouncedValue from '#hooks/useDebouncedValue';
import useDocumentSize from '#hooks/useDocumentSize';

import { suffixDrupalEndpoint, HELIX_REST_ENDPOINT } from '#utils/common';

import { toSentenceCase } from './EventListItem';
import RawIduMap, {
    MapFocus,
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

const MOBILE_BREAKPOINT = 720;

const giddLink = suffixDrupalEndpoint('/database/displacement-data');
// the Helix REST endpoint (…/external-api/) hosts the API docs at /#/
const documentationLink = `${HELIX_REST_ENDPOINT.replace(/\/+$/, '')}/#/`;

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

const IDU_REFERENCES = gql`
    query IduReferences($clientId: String!) {
        iduReferences(clientId: $clientId) @rest(
            type: "IduReferences",
            method: "GET",
            endpoint: "helix",
            path: "idus/references/?client_id={args.clientId}"
        ) {
            disasterTypes { id name }
            disasterSubTypes { id name type_id }
            violenceTypes { id name }
            violenceSubTypes { id name type_id }
            geographicalGroups { id name }
            countries { id iso3 geographical_group_id idmcShortName bbox }
        }
    }
`;

const formatDate = (date: string | undefined) => (
    date ? formatDateToString(decodeDate(date), 'dd MMM yyyy') : ''
);

type CauseKey = 'Conflict' | 'Disaster';
interface CauseOption {
    key: CauseKey;
    label: string;
}
const causeKeySelector = (option: CauseOption) => option.key;
const causeLabelSelector = (option: CauseOption) => option.label;
const causeOptions: CauseOption[] = [
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
    const [cause, setCause] = useState<CauseKey | undefined>();
    const [triggerTypes, setTriggerTypes] = useState<string[]>([]);
    const [regions, setRegions] = useState<string[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string | undefined>(defaultStartDate);
    const [endDate, setEndDate] = useState<string | undefined>(defaultEndDate);
    const [mapOrTable, setMapOrTable] = useState<ViewKey>('map');
    // the open map popup lives here so events and filter changes can drive it
    const [mapSelection, setMapSelection] = useState<MapSelection | undefined>();
    const [flyTo, setFlyTo] = useState<LngLatLike | undefined>();
    const [fitBounds, setFitBounds] = useState<LngLatBoundsLike | undefined>();
    const [mapFocus, setMapFocus] = useState<MapFocus | undefined>();
    const [resetTrigger, setResetTrigger] = useState(0);
    const prevMapFocusRef = useRef<MapFocus | undefined>(undefined);
    // the event row highlighted in the pane == the event whose popup is open
    const selectedEventId = mapSelection?.eventId;

    // the map is hidden on mobile, so event rows that open a map popup are inert
    const { width: viewportWidth } = useDocumentSize();
    const isMobile = viewportWidth <= MOBILE_BREAKPOINT;

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
        data: referencesData,
    } = useQuery<IduReferencesQuery, IduReferencesQueryVariables>(
        IDU_REFERENCES,
        {
            variables: {
                clientId: clientCode,
            },
        },
    );

    const idusAll = useMemo(() => (
        iso3
            ? iduData?.idu?.filter((item) => item.iso3 === iso3)
            : iduData?.idu
    ), [iso3, iduData]);

    const idus = useMemo(
        () => idusAll?.filter((item) => item.role === 'Recommended figure'),
        [idusAll],
    );

    const {
        regionToIso3,
        regionOptions,
        countryBboxMap,
    } = useMemo(() => {
        const refCountries = referencesData?.iduReferences?.countries ?? [];
        const refGroups = referencesData?.iduReferences?.geographicalGroups ?? [];

        const regionIso3Map = new Map<string, string[]>();
        const bboxMap = new Map<string, number[]>();
        refCountries.forEach((country) => {
            if (isTruthyString(country.iso3)) {
                if (isDefined(country.geographical_group_id)) {
                    const key = String(country.geographical_group_id);
                    const existing = regionIso3Map.get(key) ?? [];
                    existing.push(country.iso3 as string);
                    regionIso3Map.set(key, existing);
                }
                if (isDefined(country.bbox) && country.bbox.length === 4) {
                    bboxMap.set(country.iso3 as string, country.bbox as number[]);
                }
            }
        });

        const options: Option[] = refGroups
            .map((g) => ({ key: String(g.id), label: g.name }))
            .sort((a, b) => compareString(a.label, b.label));

        return {
            regionToIso3: regionIso3Map,
            regionOptions: options,
            countryBboxMap: bboxMap,
        };
    }, [referencesData]);

    // Trigger type options come from the references API (not derived from IDU data),
    // grouped by cause and limited to the groups matching the cause selection.
    const triggerOptions = useMemo<TriggerOption[]>(() => {
        const disasterTypes = referencesData?.iduReferences?.disasterTypes ?? [];
        const violenceSubTypes = referencesData?.iduReferences?.violenceSubTypes ?? [];

        const disasterOpts: TriggerOption[] = disasterTypes.map((t) => ({
            key: t.name,
            label: toSentenceCase(t.name) ?? t.name,
            groupKey: `1-${TRIGGER_GROUP_DISASTER}`,
            groupLabel: TRIGGER_GROUP_DISASTER,
        }));
        const conflictOpts: TriggerOption[] = violenceSubTypes.map((t) => ({
            key: t.name,
            label: toSentenceCase(t.name) ?? t.name,
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
    }, [referencesData, cause]);

    // Country options come from the references API, narrowed to the selected region(s).
    const countryOptions = useMemo<Option[]>(() => {
        const refCountries = referencesData?.iduReferences?.countries ?? [];

        const allowedIso3 = regions.length > 0
            ? new Set<string>(regions.flatMap((id) => regionToIso3.get(id) ?? []))
            : undefined;

        return refCountries
            .filter((c) => isTruthyString(c.iso3)
                && (!allowedIso3 || allowedIso3.has(c.iso3 as string)))
            .map((c) => ({ key: `c:${c.iso3}`, label: c.idmcShortName ?? (c.iso3 as string) }))
            .sort((a, b) => compareString(a.label, b.label));
    }, [referencesData, regions, regionToIso3]);

    const buildIduFilter = useCallback((source: typeof idus) => {
        const regionIso3 = regions.length > 0
            ? new Set<string>(regions.flatMap((id) => regionToIso3.get(id) ?? []))
            : undefined;
        const countryIso3 = locations.length > 0
            ? new Set<string>(locations.map((key) => key.slice(2)))
            : undefined;

        return source?.filter((d) => {
            if (isNotDefined(d.displacement_date)) {
                return false;
            }
            if (isDefined(cause) && d.displacement_type !== cause) {
                return false;
            }
            if (
                triggerTypes.length > 0
                && !triggerTypes.some((value) => d.type === value)
            ) {
                return false;
            }
            if (regionIso3 && (isNotDefined(d.iso3) || !regionIso3.has(d.iso3))) {
                return false;
            }
            if (countryIso3 && (isNotDefined(d.iso3) || !countryIso3.has(d.iso3))) {
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
    }, [cause, triggerTypes, regions, regionToIso3, locations, searchText, startDate, endDate]);

    const idusForMap = useMemo(() => buildIduFilter(idus), [idus, buildIduFilter]);

    const idusForExport = useMemo(
        () => buildIduFilter(idusAll),
        [idusAll, buildIduFilter],
    );

    const handleDownloadGeojson = useCallback(() => {
        if (isNotDefined(idusForExport)) {
            return;
        }
        const features = idusForExport
            .filter((item) => isDefined(item.longitude) && isDefined(item.latitude))
            .map((item) => {
                const {
                    __typename: _,
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
    }, [idusForExport]);

    const handleDownloadCsv = useCallback(() => {
        if (isNotDefined(idusForExport)) {
            return;
        }
        const csv = toCsv(idusForExport as unknown as Record<string, unknown>[]);
        triggerDownload(csv, 'idu-data.csv', 'text/csv;charset=utf-8');
    }, [idusForExport]);

    const prevIdusForMap = useRef(idusForMap);
    if (prevIdusForMap.current !== idusForMap) {
        prevIdusForMap.current = idusForMap;
        if (isDefined(mapSelection)) {
            setMapSelection(undefined);
            setFlyTo(undefined);
            setFitBounds(undefined);
        }
    }

    // clear focus and zoom out on any filter change
    React.useEffect(() => {
        setMapFocus(undefined);
        setResetTrigger((n) => n + 1);
    }, [cause, triggerTypes, regions, locations, searchText, startDate, endDate]);

    // zoom out whenever focus is explicitly removed (pill, trigger toggle, map click, etc.)
    React.useEffect(() => {
        if (isDefined(prevMapFocusRef.current) && isNotDefined(mapFocus)) {
            setResetTrigger((n) => n + 1);
        }
        prevMapFocusRef.current = mapFocus;
    }, [mapFocus]);

    const handleReset = useCallback(() => {
        setSearchInput(undefined);
        setCause(undefined);
        setTriggerTypes([]);
        setRegions([]);
        setLocations([]);
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        // close any open map popup even if the filters were already at default
        setMapSelection(undefined);
        setFlyTo(undefined);
        setFitBounds(undefined);
    }, []);

    // selecting a region narrows the country options, so drop any selected
    // country that no longer falls within the chosen region(s)
    const applyRegions = useCallback((nextRegions: string[]) => {
        setRegions(nextRegions);
        if (nextRegions.length > 0) {
            const allowed = new Set(nextRegions.flatMap((id) => regionToIso3.get(id) ?? []));
            setLocations((prev) => prev.filter((key) => allowed.has(key.slice(2))));
        }
    }, [regionToIso3]);

    const handleDateRangeChange = useCallback((
        start: string | undefined,
        end: string | undefined,
    ) => {
        setStartDate(start);
        setEndDate(end);
    }, []);

    // changing the cause changes which trigger groups are available, so drop the
    // current trigger selection to avoid a now-hidden filter lingering
    const handleCauseChange = useCallback((value: CauseKey | undefined) => {
        setCause(value);
        setTriggerTypes([]);
    }, []);

    const handleCountrySelect = useCallback((countryIso3: string) => {
        const bbox = countryBboxMap.get(countryIso3);
        if (isDefined(bbox) && bbox.length === 4) {
            setFitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]]);
            setFlyTo(undefined);
        }
        setMapFocus({ type: 'country', iso3: countryIso3 });
        setMapOrTable('map');
    }, [countryBboxMap]);

    const handleTriggerSelect = useCallback((triggerType: string) => {
        setMapFocus((prev) => (
            prev?.type === 'trigger' && prev.triggerType === triggerType
                ? undefined
                : { type: 'trigger', triggerType }
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
        // open the popup on the event's first (earliest) displacement
        const record = records.reduce((a, b) => (
            (a.displacement_date ?? '') <= (b.displacement_date ?? '') ? a : b
        ));
        const lngLat: LngLatLike = [record.longitude as number, record.latitude as number];
        setMapSelection({
            lngLat,
            properties: [iduToPopupProperties(record)],
            eventId,
            recordId: record.id,
        });
        setFitBounds(undefined);
        setFlyTo(lngLat);
        setMapFocus({ type: 'event', eventId });
    }, [idusForMap]);

    // open the popup for one specific record (IduTable rows and RecentEvents IDUs)
    const handleRecordSelect = useCallback((recordId: number) => {
        setMapOrTable('map');
        const record = (idusForMap ?? []).find((d) => (
            d.id === recordId
            && isDefined(d.longitude)
            && isDefined(d.latitude)
        ));
        if (isNotDefined(record)) {
            return;
        }
        const lngLat: LngLatLike = [record.longitude as number, record.latitude as number];
        setMapSelection({
            lngLat,
            properties: [iduToPopupProperties(record)],
            eventId: record.event_id ?? undefined,
            recordId: record.id,
        });
        setFitBounds(undefined);
        setFlyTo(lngLat);
        // clear focus unless the selected record belongs to the focused entity
        setMapFocus((prev) => {
            if (!prev) return prev;
            if (prev.type === 'event' && record.event_id === prev.eventId) return prev;
            if (prev.type === 'country' && record.iso3 === prev.iso3) return prev;
            return undefined;
        });
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
        // clear focus unless the clicked point belongs to the focused entity
        setMapFocus((prev) => {
            if (!prev) return prev;
            if (prev.type === 'event' && properties.eventId === prev.eventId) return prev;
            if (prev.type === 'country' && properties.iso3 === prev.iso3) return prev;
            return undefined;
        });
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

    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const handleFiltersToggle = useCallback(() => {
        setFiltersExpanded((prev) => !prev);
    }, []);

    const appliedFilterCount = (
        (searchText && searchText.trim() ? 1 : 0)
        + (isDefined(cause) ? 1 : 0)
        + (triggerTypes.length > 0 ? 1 : 0)
        + (regions.length > 0 ? 1 : 0)
        + (locations.length > 0 ? 1 : 0)
        + (startDate !== defaultStartDate || endDate !== defaultEndDate ? 1 : 0)
    );

    const selectedIso3 = mapFocus?.type === 'country' ? mapFocus.iso3 : undefined;
    const selectedTriggerType = mapFocus?.type === 'trigger' ? mapFocus.triggerType : undefined;

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
        if (isDefined(cause)) {
            const causeOption = causeOptions.find((option) => option.key === cause);
            filters.push({
                key: 'cause',
                label: causeOption?.label ?? cause,
                onRemove: () => handleCauseChange(undefined),
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
        regions.forEach((regionId) => {
            const option = regionOptions.find((item) => item.key === regionId);
            filters.push({
                key: `region:${regionId}`,
                label: option?.label ?? regionId,
                onRemove: () => applyRegions(regions.filter((item) => item !== regionId)),
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
    }, [
        searchText,
        cause,
        triggerTypes,
        regions,
        regionOptions,
        applyRegions,
        locations,
        startDate,
        endDate,
        countryOptions,
    ]);

    if (error) {
        return {
            idus,
            widget: <Message message="Some error occurred!" />,
        };
    }

    const dateRange = `${formatDate(startDate)} – ${formatDate(endDate)}`;
    const effectiveCause = cause ?? 'all';
    const disasterBreakdownDesc = `Breakdown by hazard type, ${dateRange}.`;
    const conflictBreakdownDesc = `Breakdown by type of conflict and violence, ${dateRange}.`;

    const slides: { key: string; content: React.ReactNode }[] = [
        {
            key: 'recent-events',
            content: (
                <RecentEvents
                    idus={idusForMap}
                    startDate={startDate}
                    endDate={endDate}
                    onRecordSelect={isMobile ? undefined : handleRecordSelect}
                    selectedRecordId={mapSelection?.recordId}
                    expandable={isMobile}
                />
            ),
        },
        {
            key: 'top-countries',
            content: (
                <TopCountries
                    idus={idusForMap}
                    cause={effectiveCause}
                    startDate={startDate}
                    endDate={endDate}
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
                    description={disasterBreakdownDesc}
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
                    description={conflictBreakdownDesc}
                    onTriggerSelect={handleTriggerSelect}
                    selectedTriggerType={selectedTriggerType}
                />
            ),
        },
        {
            key: 'largest-events',
            content: (
                <LargestEvents
                    idus={idusForMap}
                    cause={effectiveCause}
                    startDate={startDate}
                    endDate={endDate}
                    onEventSelect={isMobile ? undefined : handleEventSelect}
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
                        <SelectInput
                            className={_cs(styles.cause, styles.filterInput)}
                            optionsPopupClassName={styles.selectPopup}
                            name="cause"
                            placeholder="All causes"
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
                            <>
                                <MultiSelectInput
                                    className={_cs(styles.regions, styles.filterInput)}
                                    optionsPopupClassName={styles.selectPopup}
                                    name="regions"
                                    placeholder="All regions"
                                    options={regionOptions}
                                    keySelector={optionKeySelector}
                                    labelSelector={optionLabelSelector}
                                    value={regions}
                                    onChange={applyRegions}
                                />
                                <MultiSelectInput
                                    className={_cs(styles.countries, styles.filterInput)}
                                    optionsPopupClassName={styles.selectPopup}
                                    name="locations"
                                    placeholder="All countries"
                                    options={countryOptions}
                                    keySelector={optionKeySelector}
                                    labelSelector={optionLabelSelector}
                                    value={locations}
                                    onChange={setLocations}
                                />
                            </>
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
                    <div className={mapOrTable !== 'map' ? styles.viewHidden : undefined}>
                        <RawIduMap
                            idus={idusForMap}
                            onCountryFocus={isNotDefined(iso3) ? handleCountrySelect : undefined}
                            selection={mapSelection}
                            flyTo={flyTo}
                            fitBounds={fitBounds}
                            focus={mapFocus}
                            resetTrigger={resetTrigger}
                            onPointClick={handleMapPointClick}
                            onClose={handleMapPopupClose}
                        />
                    </div>
                    {mapOrTable === 'table' && (
                        <IduTable
                            idus={idusForMap}
                            onRecordSelect={handleRecordSelect}
                        />
                    )}
                    <div className={styles.viewToggle} title="Switch between map and table">
                        <SegmentInput
                            className={_cs(styles.filterInput, styles.filterSegment)}
                            name="view"
                            options={viewOptions}
                            keySelector={viewKeySelector}
                            labelSelector={viewLabelSelector}
                            value={mapOrTable}
                            onChange={(v) => {
                                setMapOrTable(v);
                                if (v === 'table') {
                                    setMapFocus(undefined);
                                }
                            }}
                        />
                        {isDefined(mapFocus) && (
                            <Button
                                name={undefined}
                                className={styles.focusPill}
                                onClick={() => setMapFocus(undefined)}
                                variant="default"
                            >
                                Remove focus
                            </Button>
                        )}
                    </div>
                </div>
                <div className={styles.rightPane}>
                    <StatBar idus={idusForMap} />
                    <SlideCarousel
                        className={styles.carousel}
                        slides={slides}
                        fillHeight
                        expandable={false}
                        pagerExtra={(
                            <TooltipIcon
                                className={styles.definitions}
                                tooltipClassName={styles.definitionsTooltip}
                                trigger="click"
                                title="Definitions"
                                infoLabel={(
                                    <>
                                        <IoInformationCircleOutline />
                                        Definitions
                                    </>
                                )}
                                content={(
                                    <div className={styles.definitionsContent}>
                                        <p>
                                            <strong>Internal displacements</strong>
                                            {' — the number of times people are forced to move inside their country during a specific time period.'}
                                        </p>
                                        <p>
                                            <strong>Internally displaced persons (IDPs)</strong>
                                            {' — the number of people living in internal displacement at a specific point in time.'}
                                        </p>
                                        <p>
                                            {'The IDU reports '}
                                            <strong>internal displacements only</strong>
                                            {'. IDP figures are included in the '}
                                            <a href={giddLink} target="_parent">GIDD</a>
                                            .
                                        </p>
                                    </div>
                                )}
                            />
                        )}
                    />
                    <div className={styles.rightFooter}>
                        <p className={styles.footerText}>
                            <strong>IDMC&apos;s Internal Displacement Updates (IDU)</strong>
                            {' are preliminary estimates of internal displacement events reported in the last 180 days. This provisional data is updated daily with new available data. Validated, annual estimates are published in the '}
                            <strong>
                                <a href={giddLink} target="_parent">
                                    Global Internal Displacement Database (GIDD)
                                </a>
                            </strong>
                            {'. To request an API key, read the '}
                            <strong>
                                <a href={documentationLink} target="_parent">
                                    documentation
                                </a>
                            </strong>
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
                                CSV
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return {
        idus,
        widget,
    };
}

export default useIduMap;
