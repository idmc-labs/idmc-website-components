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
import { buildScopeLabel, buildTriggerFilterSuffix } from '#utils/strings';

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
            disaster_types { id name }
            disaster_sub_types { id name type_id }
            violence_types { id name }
            violence_sub_types { id name type_id }
            geographical_groups { id name }
            countries { id iso3 geographical_group_id idmc_short_name bbox }
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
    { key: 'Conflict', label: 'Conflict and Violence' },
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

// Unlike GIDD, the IDU payload carries only the raw `figure`, so 'full' really is the
// exact reported number.
type NumberFormat = 'abbreviated' | 'full';
interface NumberFormatOption {
    key: NumberFormat;
    label: string;
}
const numberFormatKeySelector = (option: NumberFormatOption) => option.key;
const numberFormatLabelSelector = (option: NumberFormatOption) => option.label;
const numberFormatOptions: NumberFormatOption[] = [
    { key: 'abbreviated', label: 'Rounded' },
    { key: 'full', label: 'Exact' },
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

// leave breathing room around a focus/zoom target so markers don't sit at the
// very edge, and a single marker doesn't zoom in all the way
const FOCUS_BUFFER_RATIO = 0.2;
const FOCUS_MIN_BUFFER_DEG = 1.5;

function padBounds(
    [[minLng, minLat], [maxLng, maxLat]]: [[number, number], [number, number]],
): LngLatBoundsLike {
    const lngBuffer = Math.max((maxLng - minLng) * FOCUS_BUFFER_RATIO, FOCUS_MIN_BUFFER_DEG);
    const latBuffer = Math.max((maxLat - minLat) * FOCUS_BUFFER_RATIO, FOCUS_MIN_BUFFER_DEG);
    return [
        [minLng - lngBuffer, Math.max(minLat - latBuffer, -85)],
        [maxLng + lngBuffer, Math.min(maxLat + latBuffer, 85)],
    ];
}

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

const EXCEL_COLUMNS: { header: string; key: string }[] = [
    { header: 'Id', key: 'id' },
    { header: 'Country', key: 'country' },
    { header: 'Iso3', key: 'iso3' },
    { header: 'Latitude', key: 'latitude' },
    { header: 'Longitude', key: 'longitude' },
    { header: 'Centroid', key: 'centroid' },
    { header: 'Role', key: 'role' },
    { header: 'DisplacementType', key: 'displacement_type' },
    { header: 'Qualifier', key: 'qualifier' },
    { header: 'Figure', key: 'figure' },
    { header: 'DisplacementDate', key: 'displacement_date' },
    { header: 'DisplacementStartDate', key: 'displacement_start_date' },
    { header: 'DisplacementEndDate', key: 'displacement_end_date' },
    { header: 'Year', key: 'year' },
    { header: 'EventId', key: 'event_id' },
    { header: 'EventName', key: 'event_name' },
    { header: 'EventCodes', key: 'event_codes' },
    { header: 'EventCodeTypes', key: 'event_code_types' },
    { header: 'EventStartDate', key: 'event_start_date' },
    { header: 'EventEndDate', key: 'event_end_date' },
    { header: 'Category', key: 'category' },
    { header: 'Subcategory', key: 'subcategory' },
    { header: 'Type', key: 'type' },
    { header: 'Subtype', key: 'subtype' },
    { header: 'StandardPopupText', key: 'standard_popup_text' },
    { header: 'StandardInfoText', key: 'standard_info_text' },
    { header: 'OldId', key: 'old_id' },
    { header: 'Sources', key: 'sources' },
    { header: 'SourceUrl', key: 'source_url' },
    { header: 'LocationsName', key: 'locations_name' },
    { header: 'LocationsCoordinates', key: 'locations_coordinates' },
    { header: 'LocationsAccuracy', key: 'locations_accuracy' },
    { header: 'LocationsType', key: 'locations_type' },
    { header: 'DisplacementOccurred', key: 'displacement_occurred' },
    { header: 'CreatedAt', key: 'created_at' },
];

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
    const [numberFormat, setNumberFormat] = useState<NumberFormat>('abbreviated');
    const abbreviateFigures = numberFormat === 'abbreviated';
    const [mountedViews, setMountedViews] = useState<Set<ViewKey>>(() => new Set<ViewKey>(['map']));
    // the open map popup lives here so events and filter changes can drive it
    const [mapSelection, setMapSelection] = useState<MapSelection | undefined>();
    const [flyTo, setFlyTo] = useState<LngLatLike | undefined>();
    const [fitBounds, setFitBounds] = useState<LngLatBoundsLike | undefined>();
    const [mapFocus, setMapFocus] = useState<MapFocus | undefined>();
    const [resetTrigger, setResetTrigger] = useState(0);
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
        loading: referencesLoading,
    } = useQuery<IduReferencesQuery, IduReferencesQueryVariables>(
        IDU_REFERENCES,
        {
            variables: {
                clientId: clientCode,
            },
        },
    );

    const pending = loading || referencesLoading;

    const idusAll = useMemo(() => (
        iso3
            ? iduData?.idu?.filter((item) => item.iso3 === iso3)
            : iduData?.idu
    ), [iso3, iduData]);

    const idus = useMemo(
        () => idusAll?.filter((item) => item.role === 'Recommended figure'),
        [idusAll],
    );

    // the bubble scale is anchored to the largest figure regardless of the
    // active filters, so bubbles keep a stable size as filters change
    const maxValue = useMemo(
        () => (idus ?? []).reduce((acc, item) => Math.max(acc, item.figure ?? 0), 0),
        [idus],
    );

    const {
        regionToIso3,
        regionOptions,
        countryBboxMap,
    } = useMemo(() => {
        const refCountries = referencesData?.iduReferences?.countries ?? [];
        const refGroups = referencesData?.iduReferences?.geographical_groups ?? [];

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
        const disasterTypes = referencesData?.iduReferences?.disaster_types ?? [];
        const violenceSubTypes = referencesData?.iduReferences?.violence_sub_types ?? [];

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
            .map((c) => ({ key: `c:${c.iso3}`, label: c.idmc_short_name ?? (c.iso3 as string) }))
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
                && !triggerTypes.some(
                    // NOTE: disasters filter by type, conflicts by subtype
                    (value) => (d.displacement_type === 'Disaster' ? d.type : d.subtype) === value,
                )
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

    const appliedFilterCount = (
        (searchText && searchText.trim() ? 1 : 0)
        + (isDefined(cause) ? 1 : 0)
        + (triggerTypes.length > 0 ? 1 : 0)
        + (regions.length > 0 ? 1 : 0)
        + (locations.length > 0 ? 1 : 0)
        + (startDate !== defaultStartDate || endDate !== defaultEndDate ? 1 : 0)
    );

    // ease/rotate the globe to frame a set of records; returns false when there is
    // nothing to frame, so the caller can fall back to the default globe view
    const showItemsOnMap = useCallback((items: typeof idus): boolean => {
        let minLng = Infinity;
        let minLat = Infinity;
        let maxLng = -Infinity;
        let maxLat = -Infinity;
        let count = 0;
        (items ?? []).forEach((d) => {
            if (isDefined(d.longitude) && isDefined(d.latitude)) {
                count += 1;
                minLng = Math.min(minLng, d.longitude);
                minLat = Math.min(minLat, d.latitude);
                maxLng = Math.max(maxLng, d.longitude);
                maxLat = Math.max(maxLat, d.latitude);
            }
        });
        if (count === 0) {
            return false;
        }
        setFlyTo(undefined);
        setFitBounds(padBounds([[minLng, minLat], [maxLng, maxLat]]));
        return true;
    }, []);

    const frameCountry = useCallback((): boolean => {
        if (isNotDefined(iso3)) {
            return false;
        }
        if (showItemsOnMap(idusForMap)) {
            return true;
        }
        const bbox = countryBboxMap.get(iso3);
        if (isDefined(bbox) && bbox.length === 4) {
            setFlyTo(undefined);
            setFitBounds(padBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]]));
            return true;
        }
        return false;
    }, [iso3, idusForMap, showItemsOnMap, countryBboxMap]);

    // frame the country on a country page, otherwise return to the globe
    const resetMapView = useCallback(() => {
        if (frameCountry()) {
            return;
        }
        setFlyTo(undefined);
        setFitBounds(undefined);
        setResetTrigger((n) => n + 1);
    }, [frameCountry]);

    // "Download current selection" means what the map and the table show: recommended
    // figures only, not every role behind them.
    const idusForExport = idusForMap;

    const handleDownloadGeojson = useCallback(() => {
        if (isNotDefined(idusForExport)) {
            return;
        }
        const features = idusForExport.map((item) => {
            const properties = Object.fromEntries(
                Object.entries(item).filter(([key]) => key !== '__typename'),
            );
            return {
                type: 'Feature',
                geometry: {
                    type: 'MultiPoint',
                    coordinates: (
                        isDefined(item.longitude) && isDefined(item.latitude)
                            ? [[item.longitude, item.latitude]]
                            : []
                    ),
                },
                properties,
            };
        });
        const geojson = {
            type: 'FeatureCollection',
            readme: 'IDMC Internal Displacement Updates (IDU) — preliminary estimates of internal displacement events reported in the last 180 days. Data is updated daily.',
            lastUpdated: new Date().toISOString(),
            features,
        };
        triggerDownload(
            JSON.stringify(geojson),
            'idu-data.geojson',
            'application/geo+json',
        );
    }, [idusForExport]);

    const handleDownloadExcel = useCallback(async () => {
        if (isNotDefined(idusForExport)) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ExcelJS = await import('exceljs') as any;
        const Workbook = ExcelJS.default?.Workbook ?? ExcelJS.Workbook;
        const workbook = new Workbook();

        const dataSheet = workbook.addWorksheet('IDUS_Data');
        dataSheet.columns = EXCEL_COLUMNS.map((col) => ({
            header: col.header,
            key: col.key,
            width: 22,
        }));
        idusForExport.forEach((item) => {
            const row: Record<string, unknown> = {};
            EXCEL_COLUMNS.forEach((col) => {
                row[col.key] = (item as Record<string, unknown>)[col.key] ?? null;
            });
            dataSheet.addRow(row);
        });

        const readmeSheet = workbook.addWorksheet('README');
        readmeSheet.addRow(['IDMC Internal Displacement Updates (IDU)']);
        readmeSheet.addRow(['Preliminary estimates of internal displacement events reported in the last 180 days.']);
        readmeSheet.addRow(['This provisional data is updated daily with new available data.']);
        readmeSheet.addRow(['Validated annual estimates are published in the Global Internal Displacement Database (GIDD).']);

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob(
            [buffer],
            { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'idu-data.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [idusForExport]);

    const prevIdusForMap = useRef(idusForMap);
    if (prevIdusForMap.current !== idusForMap) {
        prevIdusForMap.current = idusForMap;
        // a filter change closes any popup, drops focus, and reframes the map to
        // the new result set (falling back to the globe when nothing matches)
        setMapSelection(undefined);
        setMapFocus(undefined);
        if (!(appliedFilterCount > 0 && showItemsOnMap(idusForMap))) {
            resetMapView();
        }
    }

    // keep a view mounted once it has been opened, so its state survives toggles
    React.useEffect(() => {
        setMountedViews((prev) => {
            if (prev.has(mapOrTable)) {
                return prev;
            }
            const next = new Set(prev);
            next.add(mapOrTable);
            return next;
        });
    }, [mapOrTable]);

    const handleReset = useCallback(() => {
        setSearchInput(undefined);
        setCause(undefined);
        setTriggerTypes([]);
        setRegions([]);
        setLocations([]);
        setStartDate(defaultStartDate);
        setEndDate(defaultEndDate);
        setMapFocus(undefined);
        // close any open map popup even if the filters were already at default
        setMapSelection(undefined);
        resetMapView();
    }, [resetMapView]);

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

    // return the map to the active-filter frame, else the country/globe default
    const fitToFiltered = useCallback(() => {
        if (appliedFilterCount > 0 && showItemsOnMap(idusForMap)) {
            return;
        }
        resetMapView();
    }, [appliedFilterCount, idusForMap, showItemsOnMap, resetMapView]);

    const handleRemoveFocus = useCallback(() => {
        setMapFocus(undefined);
        setMapSelection(undefined);
        fitToFiltered();
    }, [fitToFiltered]);

    const handleCountrySelect = useCallback((countryIso3: string) => {
        const isSame = mapFocus?.type === 'country' && mapFocus.iso3 === countryIso3;
        if (isSame) {
            setMapFocus(undefined);
            fitToFiltered();
            return;
        }
        // opening a focus closes any pinned popup and reframes to the focus items
        setMapSelection(undefined);
        const focusItems = (idusForMap ?? []).filter((d) => d.iso3 === countryIso3);
        if (!showItemsOnMap(focusItems)) {
            const bbox = countryBboxMap.get(countryIso3);
            if (isDefined(bbox) && bbox.length === 4) {
                setFlyTo(undefined);
                setFitBounds(padBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]]));
            }
        }
        setMapFocus({ type: 'country', iso3: countryIso3 });
        setMapOrTable('map');
    }, [mapFocus, idusForMap, countryBboxMap, showItemsOnMap, fitToFiltered]);

    const handleTriggerSelect = useCallback((triggerType: string) => {
        const isSame = mapFocus?.type === 'trigger' && mapFocus.triggerType === triggerType;
        if (isSame) {
            setMapFocus(undefined);
            fitToFiltered();
            return;
        }
        setMapSelection(undefined);
        const focusItems = (idusForMap ?? []).filter((d) => (
            (d.displacement_type === 'Disaster' ? d.type : d.subtype) === triggerType
        ));
        showItemsOnMap(focusItems);
        setMapFocus({ type: 'trigger', triggerType });
        setMapOrTable('map');
    }, [mapFocus, idusForMap, showItemsOnMap, fitToFiltered]);

    const handleEventSelect = useCallback((eventId: number) => {
        const isSame = mapFocus?.type === 'event' && mapFocus.eventId === eventId;
        if (isSame) {
            setMapFocus(undefined);
            fitToFiltered();
            return;
        }
        setMapOrTable('map');
        const records = (idusForMap ?? []).filter((d) => (
            d.event_id === eventId
            && isDefined(d.longitude)
            && isDefined(d.latitude)
        ));
        if (records.length === 0) {
            return;
        }
        // focus and frame the event's displacements without pinning any popup
        setMapSelection(undefined);
        showItemsOnMap(records);
        setMapFocus({ type: 'event', eventId });
    }, [mapFocus, idusForMap, showItemsOnMap, fitToFiltered]);

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
        // focus the event the clicked displacement belongs to (if any)
        setMapFocus(
            isDefined(record.event_id)
                ? { type: 'event', eventId: record.event_id }
                : undefined,
        );
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

    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const handleFiltersToggle = useCallback(() => {
        setFiltersExpanded((prev) => !prev);
    }, []);

    const selectedIso3 = mapFocus?.type === 'country' ? mapFocus.iso3 : undefined;
    const selectedTriggerType = mapFocus?.type === 'trigger' ? mapFocus.triggerType : undefined;
    const focusedEventId = mapFocus?.type === 'event' ? mapFocus.eventId : undefined;

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
        handleCauseChange,
        triggerTypes,
        regions,
        regionOptions,
        applyRegions,
        locations,
        startDate,
        endDate,
        countryOptions,
    ]);

    // selected regions then countries, as display names — same shape as GIDD's
    // scope, feeds the "globally" / "in A and B" clause on every slide
    const scopeNames = useMemo(() => {
        const regionNames = regions.map((id) => (
            regionOptions.find((item) => item.key === id)?.label ?? id
        ));
        const countryNames = locations.map((key) => (
            countryOptions.find((item) => item.key === key)?.label ?? key
        ));
        return [...regionNames, ...countryNames];
    }, [regions, regionOptions, locations, countryOptions]);

    // selected trigger types split by group, for the cause-adaptive
    // "... figures are filtered to..." sentence(s)
    const { disasterTriggerLabels, conflictTriggerLabels } = useMemo(() => {
        const disaster: string[] = [];
        const conflict: string[] = [];
        triggerTypes.forEach((name) => {
            const option = triggerOptions.find((item) => item.key === name);
            if (!option) {
                return;
            }
            (option.groupLabel === TRIGGER_GROUP_DISASTER ? disaster : conflict).push(option.label);
        });
        return { disasterTriggerLabels: disaster, conflictTriggerLabels: conflict };
    }, [triggerTypes, triggerOptions]);

    if (error) {
        return {
            idus,
            pending,
            widget: <Message message="Some error occurred!" />,
        };
    }

    const dateRange = `${formatDate(startDate)} – ${formatDate(endDate)}`;
    const effectiveCause = cause ?? 'all';
    const scopeLabel = buildScopeLabel(scopeNames);
    // cause-adaptive: the opposite cause's figures aren't shown, so its filter
    // sentence is suppressed even when its trigger types are selected
    const disasterFilterSuffix = cause === 'Conflict'
        ? ''
        : buildTriggerFilterSuffix({ cause: 'disaster', labels: disasterTriggerLabels });
    const conflictFilterSuffix = cause === 'Disaster'
        ? ''
        : buildTriggerFilterSuffix({ cause: 'conflict', labels: conflictTriggerLabels });
    const combinedFilterSuffix = `${disasterFilterSuffix}${conflictFilterSuffix}`;
    // breakdown cards each show only their own cause's data → own suffix only
    const disasterBreakdownDesc = `Breakdown by trigger ${scopeLabel}, ${dateRange}.${disasterFilterSuffix}`;
    const conflictBreakdownDesc = `Breakdown by trigger ${scopeLabel}, ${dateRange}.${conflictFilterSuffix}`;

    const slides: { key: string; content: React.ReactNode }[] = [
        {
            key: 'recent-events',
            content: (
                <RecentEvents
                    idus={idusForMap}
                    startDate={startDate}
                    endDate={endDate}
                    scopeLabel={scopeLabel}
                    filterSuffix={combinedFilterSuffix}
                    onEventSelect={isMobile ? undefined : handleEventSelect}
                    selectedEventId={focusedEventId}
                    expandable={isMobile}
                    abbreviate={abbreviateFigures}
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
                    scopeLabel={scopeLabel}
                    filterSuffix={combinedFilterSuffix}
                    onCountrySelect={isMobile ? undefined : handleCountrySelect}
                    selectedIso3={selectedIso3}
                    abbreviate={abbreviateFigures}
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
                    onTriggerSelect={isMobile ? undefined : handleTriggerSelect}
                    selectedTriggerType={selectedTriggerType}
                    abbreviate={abbreviateFigures}
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
                    onTriggerSelect={isMobile ? undefined : handleTriggerSelect}
                    selectedTriggerType={selectedTriggerType}
                    abbreviate={abbreviateFigures}
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
                    scopeLabel={scopeLabel}
                    filterSuffix={combinedFilterSuffix}
                    onEventSelect={isMobile ? undefined : handleEventSelect}
                    selectedEventId={selectedEventId}
                    abbreviate={abbreviateFigures}
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
                    <SegmentInput
                        className={_cs(
                            styles.numberFormat,
                            styles.filterInput,
                            styles.filterSegment,
                        )}
                        name="numberFormat"
                        options={numberFormatOptions}
                        keySelector={numberFormatKeySelector}
                        labelSelector={numberFormatLabelSelector}
                        value={numberFormat}
                        onChange={setNumberFormat}
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
                    {mountedViews.has('map') && (
                        <div
                            className={_cs(
                                styles.viewPane,
                                mapOrTable !== 'map' && styles.viewHidden,
                            )}
                        >
                            <RawIduMap
                                idus={idusForMap}
                                maxValue={maxValue}
                                onCountryFocus={
                                    isNotDefined(iso3) ? handleCountrySelect : undefined
                                }
                                onEventFocus={handleEventSelect}
                                selection={mapSelection}
                                flyTo={flyTo}
                                fitBounds={fitBounds}
                                focus={mapFocus}
                                filtersActive={appliedFilterCount > 0}
                                disableSpin={isDefined(iso3)}
                                resetTrigger={resetTrigger}
                                abbreviate={abbreviateFigures}
                                onPointClick={handleMapPointClick}
                                onClose={handleMapPopupClose}
                                onRemoveFocus={handleRemoveFocus}
                            />
                        </div>
                    )}
                    {mountedViews.has('table') && (
                        <div
                            className={_cs(
                                styles.viewPane,
                                mapOrTable !== 'table' && styles.viewHidden,
                            )}
                        >
                            <IduTable
                                idus={idusForMap}
                                onRecordSelect={handleRecordSelect}
                                abbreviate={abbreviateFigures}
                            />
                        </div>
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
                                    // leaving the map view drops any active focus
                                    setMapFocus(undefined);
                                }
                            }}
                        />
                    </div>
                </div>
                <div className={styles.rightPane}>
                    <StatBar idus={idusForMap} abbreviate={abbreviateFigures} />
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
                                onClick={handleDownloadExcel}
                                disabled={loading || isNotDefined(idusForMap)}
                            >
                                Excel
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return {
        idus,
        pending,
        widget,
    };
}

export default useIduMap;
